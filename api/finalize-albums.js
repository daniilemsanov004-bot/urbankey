// /api/finalize-albums — вторая половина обработки альбомов (несколько
// фото + одна подпись в одном посте Telegram-канала).
//
// ЗАЧЕМ ЭТОТ ФАЙЛ ОТДЕЛЬНО ОТ telegram-webhook.js:
// Раньше сообщение с подписью само ждало (внутри одного вызова функции),
// пока остальные фото альбома долетят и загрузятся, и само же создавало
// объект. Для больших альбомов (7-8 фото) это оказалось ненадёжно — на
// части тестов часть фото терялась. Теперь webhook (telegram-webhook.js)
// только СОХРАНЯЕТ фото и подпись в таблицу bot_pending_albums и сразу
// отвечает Telegram, а эта функция запускается ОТДЕЛЬНО, по расписанию
// (см. ниже), сканирует таблицу и досоздаёт объекты для "созревших"
// альбомов — то есть таких, где подпись уже есть, но фото не добавлялись
// уже некоторое время (значит, все фото альбома точно долетели).
//
// КАК ПОДКЛЮЧИТЬ (один раз, после деплоя):
//   1. Выполните sql/add_album_finalize_cron.sql в Supabase (добавляет
//      нужные колонки в bot_pending_albums).
//   2. В Vercel -> Settings -> Environment Variables добавьте:
//        FINALIZE_SECRET — придумайте любую случайную строку (как и
//                          TELEGRAM_WEBHOOK_SECRET раньше)
//      Остальные переменные (PARSER_BOT_TOKEN, SUPABASE_SERVICE_KEY,
//      VITE_SUPABASE_URL, OPENAI_API_KEY) уже должны быть настроены.
//   3. На Vercel Hobby-плане встроенный Cron не подходит (там минимум —
//      раз в сутки), поэтому дёргать этот эндпоинт нужно внешним
//      бесплатным сервисом-планировщиком, например cron-job.org:
//        - Зарегистрируйтесь на cron-job.org (бесплатно)
//        - Создайте новую задачу (Cron Job)
//        - URL: https://ВАШ-ДОМЕН/api/finalize-albums?secret=<FINALIZE_SECRET>
//        - Периодичность: каждую 1 минуту
//        - Метод: GET (или POST — этот файл принимает оба)
//
//   После этого посты с альбомами будут появляться на сайте с задержкой
//   примерно 1-2 минуты (время на то, чтобы cron-job.org дёрнул эндпоинт
//   + 10 секунд "тишины", которые функция ждёт перед тем как считать
//   альбом готовым) — это плата за надёжность вместо мгновенной, но
//   иногда терявшей часть фото публикации.

import { createClient } from "@supabase/supabase-js";


// Чистая логика разбора поста и перевода — без Telegram/Supabase.
// Используется и в server/bot.js (long-polling, для запуска на своём
// сервере/VPS), и в api/telegram-webhook.js (serverless на Vercel).
// Логика в одном месте, чтобы не расходилась между двумя способами
// запуска бота.


// ---------------------------------------------------------------------
// Словарь типов жилья.
// ---------------------------------------------------------------------
const TYPE_DICT = [
    { test: /вилл|villa/i, ru: "Вилла", en: "Villa", uz: "Villa" },
    { test: /коттедж|cottage|kottej/i, ru: "Коттедж", en: "Cottage", uz: "Kottej" },
    { test: /резиденци|residence|rezidensiya/i, ru: "Резиденция", en: "Residence", uz: "Rezidensiya" },
    { test: /пентхаус|penthouse|pentxaus/i, ru: "Пентхаус", en: "Penthouse", uz: "Pentxaus" },
    { test: /\bдом\b|\bhouse\b|\buy\b/i, ru: "Дом", en: "House", uz: "Uy" }
];

function detectType(text) {

    // явное слово "квартира" в русском тексте — самый надёжный сигнал.
    // Проверяем его ДО словаря ниже: иначе название ЖК вроде "Dream
    // House" или "Sunny Villas" по ошибке определяло тип как "Дом"/
    // "Вилла", хотя в тексте прямым текстом написано "квартира".
    if (/квартир|kvartira|apartment/i.test(text)) {
        return { ru: "Квартира", en: "Apartment", uz: "Kvartira" };
    }

    for (const t of TYPE_DICT) {
        if (t.test.test(text)) {
            return { ru: t.ru, en: t.en, uz: t.uz };
        }
    }

    return { ru: "Квартира", en: "Apartment", uz: "Kvartira" };
}




const AMENITY_DICT = [
    { test: /парковк|паркинг/i, ru: "Парковка", en: "Parking", uz: "Parking" },
    { test: /мебел/i, ru: "Мебель", en: "Furniture", uz: "Mebel" },
    { test: /техник/i, ru: "Бытовая техника", en: "Appliances", uz: "Maishiy texnika" },
    { test: /кондиционер/i, ru: "Кондиционер", en: "Air conditioning", uz: "Konditsioner" },
    { test: /лифт/i, ru: "Лифт", en: "Elevator", uz: "Lift" },
    { test: /детск\w*\s+площад/i, ru: "Детская площадка", en: "Playground", uz: "Bolalar maydonchasi" },
    { test: /тихий двор|зелен\w*\s+двор|зелён\w*\s+двор|ухожен\w*\s+двор/i, ru: "Тихий двор", en: "Quiet courtyard", uz: "Tinch hovli" },
    { test: /гардеробн/i, ru: "Гардеробная", en: "Walk-in closet", uz: "Kiyim xonasi" },
    { test: /раздельн\w*\s+санузел/i, ru: "Раздельный санузел", en: "Separate bathroom", uz: "Alohida hammom" },
    { test: /панорамн\w*\s+(вид|окна)/i, ru: "Панорамный вид", en: "Panoramic view", uz: "Panorama manzara" },
    { test: /вид на город|вид на море/i, ru: "Вид на город", en: "City view", uz: "Shahar manzarasi" },
    { test: /\bохран/i, ru: "Охрана", en: "Security", uz: "Xavfsizlik" },
    { test: /консьерж/i, ru: "Консьерж", en: "Concierge", uz: "Konsyerj" },
    { test: /бассейн/i, ru: "Бассейн", en: "Pool", uz: "Basseyn" },
    { test: /террас/i, ru: "Терраса", en: "Terrace", uz: "Terrasa" },
    { test: /балкон/i, ru: "Балкон", en: "Balcony", uz: "Balkon" },
    { test: /стиральн\w*\s+машин/i, ru: "Стиральная машина", en: "Washing machine", uz: "Kir yuvish mashinasi" },
    { test: /холодильник/i, ru: "Холодильник", en: "Refrigerator", uz: "Muzlatgich" },
    { test: /телевизор/i, ru: "Телевизор", en: "TV", uz: "Televizor" },
    { test: /дизайнерск\w*\s+ремонт|евро.?ремонт|качественн\w*\s+ремонт|нов\w*\s+ремонт/i, ru: "Свежий ремонт", en: "Fresh renovation", uz: "Yangi ta'mir" },
    { test: /новостройк/i, ru: "Новостройка", en: "New building", uz: "Yangi qurilgan" },
    { test: /панорамн\w*\s+окна|четыре окна|больш\w*\s+окна/i, ru: "Панорамные окна", en: "Panoramic windows", uz: "Panorama derazalar" },
    { test: /пожарн\w*\s+безопасн|вентиляц/i, ru: "Система вентиляции и пожарной безопасности", en: "Ventilation & fire safety system", uz: "Ventilyatsiya va yong'in xavfsizligi tizimi" }
];

function extractAmenities(text) {

    const found = [];

    for (const item of AMENITY_DICT) {
        if (item.test.test(text)) {
            found.push({ ru: item.ru, en: item.en, uz: item.uz });
        }
    }

    return found;
}




// ---------------------------------------------------------------------
// Комнатность: "2-комнатная", "3х комнатная", "двухкомнатная".
// ---------------------------------------------------------------------
const ROOM_WORDS = {
    "одно": 1, "одна": 1,
    "двух": 2, "две": 2,
    "трёх": 3, "трех": 3, "три": 3,
    "четырёх": 4, "четырех": 4, "четыре": 4,
    "пяти": 5, "пять": 5,
    "шести": 6, "шесть": 6
};

function extractRooms(text) {

    let m = text.match(/(\d+)[-\s]?(?:х|x)?[-\s]?комнат/i);
    if (m) return m[1];

    m = text.match(/(одно|одна|двух|две|трёх|трех|три|четырёх|четырех|четыре|пяти|пять|шести|шесть)[-\s]?комнат/i);
    if (m) return String(ROOM_WORDS[m[1].toLowerCase()] || "");

    return "";
}




// ---------------------------------------------------------------------
// Площадь: работает без слова "площадь" рядом, с "м2" вместо "м²",
// с запятой в дробной части. Без \b на конце — JS \w не видит кириллицу
// без флага /u, поэтому граница слова после "м²" ненадёжна.
// ---------------------------------------------------------------------
function extractArea(text) {

    let m = text.match(/площадь\D{0,20}?(\d+(?:[.,]\d+)?)\s*(?:м²|м2|кв\.?\s*м)/i);
    if (m) return m[1].replace(",", ".");

    m = text.match(/(\d+(?:[.,]\d+)?)\s*(?:м²|м2|кв\.?\s*м)/i);
    if (m) return m[1].replace(",", ".");

    return "";
}




// ---------------------------------------------------------------------
// Этаж/этажность: "5 этаж из 9", "Этаж: 12"+"Этажность: 14" отдельно,
// "1 этаж 4-этажного дома".
// ---------------------------------------------------------------------
function extractFloorInfo(text) {

    let m = text.match(/(\d+)\s*этаж\w*\s*из\s*(\d+)/i);
    if (m) return { floor: m[1], totalFloors: m[2] };

    m = text.match(/(\d+)\s*этаж\w*\s+(\d+)-этажн/i);
    if (m) return { floor: m[1], totalFloors: m[2] };

    const floorM = text.match(/Этаж\s*:\s*(\d+)/i);
    const totalM = text.match(/Этажность\s*:\s*(\d+)/i);

    if (floorM || totalM) {
        return { floor: floorM?.[1] || "", totalFloors: totalM?.[1] || "" };
    }

    m = text.match(/(\d+)\s*этаж\b/i);
    if (m) return { floor: m[1], totalFloors: "" };

    return { floor: "", totalFloors: "" };
}




// ---------------------------------------------------------------------
// Строка адреса/района/ориентира — идёт после 📍.
// ---------------------------------------------------------------------
function extractLocationLine(text) {

    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const line = lines.find(l => l.includes("📍"));

    if (!line) return "";

    return line
        .replace(/📍/g, "")
        .replace(/^Адрес\s*:\s*/i, "")
        .trim();
}




// ---------------------------------------------------------------------
// Цена: любой разделитель после метки ("Цена:", "Стоимость;", "Цена —"),
// актуальная цена вместо зачёркнутой старой.
// ---------------------------------------------------------------------
function extractPrice(text) {

    if (/~~/.test(text)) {
        const m = text.match(/Новая[^\d\n]*([\d][\d\s.,]*\$?)/i);
        if (m) return m[1].trim();
    }

    const dollarMatches = [...text.matchAll(/([\d][\d\s.,]*)\s*\$/g)];
    if (dollarMatches.length) {
        return dollarMatches[dollarMatches.length - 1][1].trim() + "$";
    }

    const textNoPercent = text.replace(/\d+(?:[.,]\d+)?\s*%/g, "");

    const m = textNoPercent.match(/(?:Цена|Стоимость|Price|Narxi)[^\d\n]*([\d][\d\s.,]*\$?)/i);
    if (m) return m[1].trim();

    return "";
}


// Числовая версия цены для полей villas/commercial_pages (там price —
// number). Понимает "83.000" (точка как разделитель тысяч), "99 500 $",
// "1400$ за 1м²" (берёт ведущее число).
function priceToNumber(raw) {

    if (!raw) return null;

    const leading = raw.match(/^[\d\s.,]+/);
    if (!leading) return null;

    let s = leading[0].replace(/\s+/g, "");

    let prev;
    do {
        prev = s;
        s = s.replace(/[.,](\d{3})(?!\d)/g, "$1");
    } while (s !== prev);

    const num = parseFloat(s.replace(",", "."));
    return Number.isFinite(num) ? num : null;
}




// ---------------------------------------------------------------------
// Коммерция или жильё.
// ---------------------------------------------------------------------
const COMMERCIAL_KEYWORDS =
    /коммерц|коммерч|помещени|склад\b|витрин|арендатор|фудкорт|бизнес|цоколь/i;

function isCommercialPost(text) {
    return COMMERCIAL_KEYWORDS.test(text);
}




// ---------------------------------------------------------------------
// Автоперевод. Бесплатный публичный эндпоинт Google Translate — тот же,
// что уже используется в /api/translate на сайте. Без ключа, без ИИ.
// ---------------------------------------------------------------------
async function translateText(text, source, target) {

    if (!text || !text.trim()) return "";
    if (source === target) return text;

    try {

        const url =
            "https://translate.googleapis.com/translate_a/single" +
            `?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`translate upstream status ${res.status}`);

        const data = await res.json();

        const translated = Array.isArray(data?.[0])
            ? data[0].map((chunk) => chunk?.[0] || "").join("")
            : "";

        return translated || text;

    } catch (e) {

        console.log("TRANSLATE ERROR:", source, "->", target, e.message);
        return text;
    }
}


// fieldsObj: объект с полями `${base}_ru` / `${base}_en` / `${base}_uz`.
// Переводит на en/uz только то, что ещё не заполнено.
async function fillMissingTranslations(fieldsObj, bases) {

    const jobs = [];

    for (const base of bases) {

        const ru = fieldsObj[`${base}_ru`];
        if (!ru) continue;

        if (!fieldsObj[`${base}_en`]) {
            jobs.push(
                translateText(ru, "ru", "en").then((v) => { fieldsObj[`${base}_en`] = v; })
            );
        }

        if (!fieldsObj[`${base}_uz`]) {
            jobs.push(
                translateText(ru, "ru", "uz").then((v) => { fieldsObj[`${base}_uz`] = v; })
            );
        }
    }

    await Promise.all(jobs);
}




// ---------------------------------------------------------------------
// Транслитерация + slug.
// ---------------------------------------------------------------------
const CYR_TO_LAT = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh",
    щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya"
};

function transliterate(str) {
    return str
        .toLowerCase()
        .split("")
        .map((ch) => CYR_TO_LAT[ch] ?? ch)
        .join("");
}

function slugify(str) {
    return (
        transliterate(str || "listing")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 60)
    ) || "listing";
}




// Описание по умолчанию — когда в посте нет ручных маркеров RU_DESC:/
// EN_DESC:/UZ_DESC: (то есть почти всегда). Берём все содержательные
// строки поста, кроме заголовка, служебных строк (Цена/Этаж/📍 и т.п.)
// и строк с телефоном/именем агента.
function isPhoneLine(line) {
    const digits = line.replace(/\D/g, "");
    return digits.length >= 7 && /\+?\d[\d\s\-()]{5,}\d/.test(line);
}

function buildDescriptionFallback(text, titleLine, isServiceLine) {

    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

    const contentLines = lines.filter(line =>
        line !== titleLine &&
        !isServiceLine(line) &&
        !isPhoneLine(line)
    );

    return contentLines.join("\n").trim();
}




// ---------------------------------------------------------------------
// Разбор текста поста в поля карточки/коммерции.
// ---------------------------------------------------------------------
function parseListing(text) {

    const lines =
        text
            .split("\n")
            .map(x => x.trim())
            .filter(Boolean);


    const isServiceLine = (line) =>
        /^#/.test(line) ||
        /^(EN|UZ|RU_DESC|EN_DESC|UZ_DESC)\s*:/i.test(line) ||
        /^(Цена|Стоимость|Price|Narxi|Ориентир|Landmark|Mo'ljal|Высота потолков|Площадь|Этаж|Этажность|Новая)\s*:?/i.test(line) ||
        line.includes("📍");


    const title_ru =
        lines.find(line => !isServiceLine(line)) || "Квартира";


    const title_en =
        text.match(/EN:\s*(.*)/)?.[1]?.trim() || "";

    const title_uz =
        text.match(/UZ:\s*(.*)/)?.[1]?.trim() || "";


    const description_ru =
        text.match(/RU_DESC:\s*([\s\S]*?)EN_DESC:/)?.[1]?.trim() ||
        buildDescriptionFallback(text, title_ru, isServiceLine);

    const description_en =
        text.match(/EN_DESC:\s*([\s\S]*?)UZ_DESC:/)?.[1]?.trim() || "";

    const description_uz =
        text.match(/UZ_DESC:\s*([\s\S]*)/)?.[1]?.trim() || "";


    const price = extractPrice(text);

    const bedrooms = extractRooms(text);

    const bathrooms =
        text.match(/(\d+)\s*(?:санузл\w*|ванн\w*|bathroom\w*|hammom\w*)/i)?.[1] || "";

    const area = extractArea(text);

    const { floor, totalFloors } = extractFloorInfo(text);

    const locationLine = extractLocationLine(text);

    const isCommercial = isCommercialPost(text);

    const isSold = /продан[оаы]|снят[оаы]? с продажи/i.test(text);

    const type = detectType(text);


    const commercialFields = {

        district_ru:
            text.match(/([А-Яа-яёЁ\-]+\s+район\w*)/i)?.[1]
            || text.match(/Ориентир:\s*(.*)/i)?.[1]
            || locationLine
            || "",

        district_en: "",
        district_uz: "",

        address_ru:
            text.match(/район\w*,\s*(.*?)\./i)?.[1] || locationLine || "",

        address_en: "",
        address_uz: "",

        landmark_ru:
            text.match(/Ориентир:\s*(.*)/i)?.[1] || "",

        landmark_en: "",
        landmark_uz: "",

        floor,
        ceiling:
            text.match(/Высота потолков\s*:?\s*([\d.,]+)/i)?.[1]?.replace(",", ".") || "",

        area
    };


    const missing = [];

    if (title_ru === "Квартира" && !/квартир/i.test(text)) missing.push("название");
    if (!price) missing.push("цена");

    if (isCommercial) {
        if (!commercialFields.area) missing.push("площадь");
    } else {
        if (!bedrooms) missing.push("кол-во комнат");
    }


    const amenities = extractAmenities(text);


    return {
        isCommercial,
        isSold,
        missing,
        title_ru,
        title_en,
        title_uz,
        description_ru,
        description_en,
        description_uz,
        price,
        priceNumber: null,
        bedrooms,
        bathrooms,
        area,
        floor,
        totalFloors,
        locationLine,
        type,
        amenities,
        commercialFields
    };
}




// =======================================================================
// РАЗБОР ЧЕРЕЗ OPENAI (опционально, если задан OPENAI_API_KEY)
//
// Один запрос на пост, строгий JSON-ответ по схеме. Модель обязана
// извлекать ТОЛЬКО то, что реально есть в тексте — никаких выдуманных
// удобств, дополненных описаний или "правдоподобных" цифр. Если что-то
// не упомянуто — соответствующее поле должно быть null/пустым, а не
// заполнено похожим на правду значением. Если запрос падает по любой
// причине (нет ключа, лимит, таймаут, невалидный JSON) — возвращаем null,
// и вызывающий код сам откатывается на regex-парсер (parseListing выше).
// =======================================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const AI_SYSTEM_PROMPT = `Ты — парсер объявлений о недвижимости. Тебе присылают сырой текст поста из Telegram-канала о продаже/аренде недвижимости в Узбекистане (обычно на русском, иногда со вставками на узбекском/английском). Извлеки структурированные данные СТРОГО по правилам ниже и верни JSON по заданной схеме.

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА:
1. Извлекай ТОЛЬКО то, что явно написано в тексте. Никогда не выдумывай, не додумывай и не предполагай информацию, которой нет в исходном тексте.
2. Если какого-то поля нет в тексте — верни null (для чисел/строк) или пустой массив (для списков). НЕ заполняй поле "правдоподобным" значением, даже если оно кажется типичным для такого объекта.
3. "amenities" (удобства) — ТОЛЬКО пункты, явно упомянутые в тексте (например, если написано "есть парковка" — добавь пункт про парковку; если про удобства вообще ничего не сказано — верни пустой массив). НИКОГДА не добавляй "стандартные" удобства, которых нет в тексте.
4. "description_ru" — краткий пересказ ОСТАЛЬНОГО текста поста (без заголовка, без цены/этажа/площади, которые уже вынесены в отдельные поля, без телефона и имени агента) СВОИМИ словами читателя объявления, но без добавления фактов, которых не было в оригинале. Если после вычитания заголовка и служебных полей ничего содержательного не остаётся — верни пустую строку.
5. "description_en" и "description_uz" — точные переводы description_ru, без художественных приукрашиваний и без добавления деталей.
6. "title_en" и "title_uz" — точные переводы title_ru.
7. Если пост вообще не про объект недвижимости (нет ни одной характеристики) — можешь оставить большинство полей null/пустыми.
8. "is_sold" = true ТОЛЬКО если в тексте явно сказано, что объект уже продан/сдан/снят с продажи (например: "ПРОДАНО", "уже сдано", "неактуально").
9. "price_raw" — цена ровно как в тексте (например "124 000 $", "83.000", "1400$ за 1м²"). "price_number" — то же самое, но как число в долларах, если валюта явно $ или это очевидно итоговая цена продажи. Если в тексте есть упоминание процента оплаты (например "при 100% оплате") — это НЕ цена, не перепутай это с суммой сделки. Если цена дана в сумах с курсом и отдельно указан итог в $ — используй именно итог в $.
10. "is_commercial" = true, если это коммерческая недвижимость (офис, склад, магазин, помещение под бизнес, отдельно стоящее здание и т.п.), false — если жильё (квартира/вилла/дом/коттедж).
11. "type_ru"/"type_en"/"type_uz" — категория ЖИЛЬЯ (Квартира/Apartment/Kvartira, Вилла/Villa/Villa, Дом/House/Uy, Коттедж/Cottage/Kottej, Резиденция/Residence/Rezidensiya, Пентхаус/Penthouse/Pentxaus) — только если это жильё. Внимание: название ЖК может само содержать слово вроде "House" или "Villas" — ориентируйся на реальный смысл текста (например, слово "квартира" явно в тексте важнее названия ЖК). Если is_commercial=true, оставь эти поля null.
12. Никогда не копируй в description номер телефона, имя агента или ссылки на инстаграм/телеграм.`;

const AI_JSON_SCHEMA = {
    name: "real_estate_listing",
    strict: true,
    schema: {
        type: "object",
        properties: {
            title_ru: { type: "string" },
            title_en: { type: "string" },
            title_uz: { type: "string" },
            description_ru: { type: "string" },
            description_en: { type: "string" },
            description_uz: { type: "string" },
            is_commercial: { type: "boolean" },
            is_sold: { type: "boolean" },
            type_ru: { type: ["string", "null"] },
            type_en: { type: ["string", "null"] },
            type_uz: { type: ["string", "null"] },
            price_raw: { type: ["string", "null"] },
            price_number: { type: ["number", "null"] },
            bedrooms: { type: ["integer", "null"] },
            bathrooms: { type: ["integer", "null"] },
            area: { type: ["number", "null"] },
            floor: { type: ["integer", "null"] },
            total_floors: { type: ["integer", "null"] },
            ceiling_height: { type: ["number", "null"] },
            district: { type: ["string", "null"] },
            address: { type: ["string", "null"] },
            landmark: { type: ["string", "null"] },
            amenities: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        ru: { type: "string" },
                        en: { type: "string" },
                        uz: { type: "string" }
                    },
                    required: ["ru", "en", "uz"],
                    additionalProperties: false
                }
            }
        },
        required: [
            "title_ru", "title_en", "title_uz",
            "description_ru", "description_en", "description_uz",
            "is_commercial", "is_sold",
            "type_ru", "type_en", "type_uz",
            "price_raw", "price_number",
            "bedrooms", "bathrooms", "area", "floor", "total_floors", "ceiling_height",
            "district", "address", "landmark", "amenities"
        ],
        additionalProperties: false
    }
};

// Приводим ответ ИИ к тому же виду, что возвращает parseListing() —
// дальше по коду (createDraftPage, processPost и т.д.) не нужно ничего
// менять, они просто получают готовый объект `parsed` из одного источника
// или другого.
function mapAiResultToParsed(ai) {

    const isCommercial = Boolean(ai.is_commercial);

    const type = {
        ru: ai.type_ru || "Квартира",
        en: ai.type_en || "Apartment",
        uz: ai.type_uz || "Kvartira"
    };

    const commercialFields = {
        district_ru: ai.district || "",
        district_en: "",
        district_uz: "",
        address_ru: ai.address || "",
        address_en: "",
        address_uz: "",
        landmark_ru: ai.landmark || "",
        landmark_en: "",
        landmark_uz: "",
        floor: ai.floor != null ? String(ai.floor) : "",
        ceiling: ai.ceiling_height != null ? String(ai.ceiling_height) : "",
        area: ai.area != null ? String(ai.area) : ""
    };

    const missing = [];
    if (!ai.title_ru) missing.push("название");
    if (!ai.price_raw) missing.push("цена");
    if (isCommercial) {
        if (ai.area == null) missing.push("площадь");
    } else {
        if (ai.bedrooms == null) missing.push("кол-во комнат");
    }

    return {
        isCommercial,
        isSold: Boolean(ai.is_sold),
        missing,
        title_ru: ai.title_ru || "Квартира",
        title_en: ai.title_en || "",
        title_uz: ai.title_uz || "",
        description_ru: ai.description_ru || "",
        description_en: ai.description_en || "",
        description_uz: ai.description_uz || "",
        price: ai.price_raw || "",
        priceNumber: ai.price_number ?? null,
        bedrooms: ai.bedrooms != null ? String(ai.bedrooms) : "",
        bathrooms: ai.bathrooms != null ? String(ai.bathrooms) : "",
        area: ai.area != null ? String(ai.area) : "",
        floor: ai.floor != null ? String(ai.floor) : "",
        totalFloors: ai.total_floors != null ? String(ai.total_floors) : "",
        locationLine: ai.district || ai.address || "",
        type,
        amenities: Array.isArray(ai.amenities) ? ai.amenities : [],
        commercialFields
    };
}

async function parseWithAI(text) {

    if (!OPENAI_API_KEY) return null;

    try {

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                temperature: 0,
                messages: [
                    { role: "system", content: AI_SYSTEM_PROMPT },
                    { role: "user", content: text }
                ],
                response_format: {
                    type: "json_schema",
                    json_schema: AI_JSON_SCHEMA
                }
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!res.ok) {
            console.log("OPENAI API ERROR:", res.status, await res.text());
            return null;
        }

        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content;

        if (!raw) {
            console.log("OPENAI: пустой ответ");
            return null;
        }

        const ai = JSON.parse(raw);

        return mapAiResultToParsed(ai);

    } catch (e) {

        console.log("AI PARSE EXCEPTION:", e.message);
        return null;
    }
}


// Пробуем ИИ, при любой неудаче — старый regex-парсер. Оба возвращают
// объект одинаковой формы, так что вызывающему коду не важно, откуда он.
async function getParsedListing(text) {
    return (await parseWithAI(text)) || parseListing(text);
}


const BOT_TOKEN = process.env.PARSER_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);


async function telegramApi(method, params) {

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
    });

    const data = await res.json();

    if (!data.ok) {
        console.log(`TELEGRAM API ERROR (${method}):`, data.description);
    }

    return data;
}


async function replyToChannel(msg, text) {
    try {
        await telegramApi("sendMessage", {
            chat_id: msg.chat.id,
            text,
            reply_to_message_id: msg.message_id
        });
    } catch (e) {
        console.log("REPLY ERROR:", e.message);
    }
}


// Telegram сам сжимает любое фото, отправленное как обычное "Photo" —
// это ограничение самого Telegram, а не бота. Если фото отправлено как
// файл ("Отправить как файл", без сжатия) — оно приходит как
// msg.document с mime_type вида image/*, без потери качества.
// Предпочитаем такой вариант, если он есть.
function getBestImageFileId(msg) {

    if (msg.document?.mime_type?.startsWith("image/")) {
        return msg.document.file_id;
    }

    if (msg.photo?.length) {
        return msg.photo[msg.photo.length - 1].file_id;
    }

    return null;
}


async function uploadPhoto(fileId) {

    try {

        const fileResp = await telegramApi("getFile", { file_id: fileId });
        if (!fileResp.ok) return "";

        const url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileResp.result.file_path}`;

        const response = await fetch(url);

        if (!response.ok) {
            console.log("DOWNLOAD FROM TELEGRAM FAILED:", response.status);
            return "";
        }

        const buffer = Buffer.from(await response.arrayBuffer());

        const looksLikeImage =
            buffer.length > 100 &&
            ((buffer[0] === 0xff && buffer[1] === 0xd8) ||
                (buffer[0] === 0x89 && buffer[1] === 0x50));

        if (!looksLikeImage) {
            console.log("DOWNLOADED FILE DOES NOT LOOK LIKE AN IMAGE, size:", buffer.length);
            return "";
        }

        // Date.now() может совпасть у нескольких фото одного альбома,
        // загружаемых почти одновременно (параллельные вызовы serverless-
        // функции) — совпавшее имя файла тихо перезаписывает предыдущее в
        // Storage, и вместо нескольких разных фото в галерею попадает
        // одно. Добавляем случайный суффикс для гарантированной уникальности.
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;

        const { error } =
            await supabase.storage
                .from("images")
                .upload(fileName, buffer, { contentType: "image/jpeg" });

        if (error) {
            console.log("UPLOAD ERROR:", error);
            return "";
        }

        const { data } = supabase.storage.from("images").getPublicUrl(fileName);
        return data.publicUrl;

    } catch (e) {

        console.log("UPLOAD EXCEPTION:", e);
        return "";
    }
}


async function createDraftPage(table, linkIdField, cardId, parsed, images) {

    try {

        const slug = `${slugify(parsed.title_en || parsed.title_ru)}-${cardId}`;

        const basePayload = {
            [linkIdField]: cardId,
            slug,

            title_ru: parsed.title_ru,
            title_en: parsed.title_en,
            title_uz: parsed.title_uz,

            description_ru: parsed.description_ru,
            description_en: parsed.description_en,
            description_uz: parsed.description_uz,

            about_ru: "",
            about_en: "",
            about_uz: "",

            price: parsed.priceNumber != null ? parsed.priceNumber : priceToNumber(parsed.price),

            images: images || [],
            amenities: parsed.amenities || [],

            is_draft: true
        };

        let payload;

        if (table === "commercial_pages") {

            payload = {
                ...basePayload,
                location_ru: parsed.commercialFields.district_ru || parsed.locationLine,
                location_en: "",
                location_uz: "",
                // Категория/тип коммерции — не используем словарь типов
                // жилья (Квартира/Вилла/Дом), он тут не подходит по смыслу.
                // Оставляем пустым, как about/class/purpose — дозаполняете
                // в админке.
                type_ru: "",
                type_en: "",
                type_uz: "",
                class_ru: "",
                class_en: "",
                class_uz: "",
                purpose_ru: "",
                purpose_en: "",
                purpose_uz: "",
                area: Number(parsed.commercialFields.area) || null,
                ceiling_height: Number(parsed.commercialFields.ceiling) || null,
                floor: Number(parsed.commercialFields.floor) || null
            };

        } else {

            payload = {
                ...basePayload,
                location_ru: parsed.locationLine,
                location_en: "",
                location_uz: "",
                type_ru: parsed.type.ru,
                type_en: parsed.type.en,
                type_uz: parsed.type.uz,
                bedrooms: Number(parsed.bedrooms) || null,
                year: null,
                square: Number(parsed.area) || null
            };
        }

        await fillMissingTranslations(payload, ["location"]);

        const { error } = await supabase.from(table).insert(payload);

        if (error) {
            console.log(`DRAFT PAGE (${table}) ERROR:`, error);
            return false;
        }

        return true;

    } catch (e) {

        console.log("DRAFT PAGE EXCEPTION:", e);
        return false;
    }
}


async function processPost(mainMsg, images, hasVideo) {

    const image = images[0] || "";

    const text = mainMsg.caption || mainMsg.text || "";
    const parsed = await getParsedListing(text);

    if (parsed.isSold) {
        await replyToChannel(mainMsg, "ℹ️ Похоже, объект уже продан/снят — пост не публикую на сайт. Если это не так, добавьте объект вручную в админке.");
        return;
    }

    await fillMissingTranslations(parsed, ["title", "description"]);

    if (parsed.isCommercial) {
        await fillMissingTranslations(parsed.commercialFields, ["district", "address", "landmark"]);
    }

    if (!image && !hasVideo) parsed.missing.push("фото");

    const baseFields = {
        title_ru: parsed.title_ru,
        title_en: parsed.title_en,
        title_uz: parsed.title_uz,
        description_ru: parsed.description_ru,
        description_en: parsed.description_en,
        description_uz: parsed.description_uz,
        image,
        price: parsed.price,
        tg_chat_id: mainMsg.chat.id,
        tg_message_id: mainMsg.message_id
    };

    const insertData = parsed.isCommercial
        ? { ...baseFields, ...parsed.commercialFields }
        : {
            ...baseFields,
            bedrooms_ru: parsed.bedrooms ? `${parsed.bedrooms} спальни` : "",
            bedrooms_en: parsed.bedrooms ? `${parsed.bedrooms} bedrooms` : "",
            bedrooms_uz: parsed.bedrooms ? `${parsed.bedrooms} yotoqxona` : "",
            bathrooms_ru: parsed.bathrooms ? `${parsed.bathrooms} ванные` : "",
            bathrooms_en: parsed.bathrooms ? `${parsed.bathrooms} bathrooms` : "",
            bathrooms_uz: parsed.bathrooms ? `${parsed.bathrooms} hammom` : "",
            type_ru: parsed.type.ru,
            type_en: parsed.type.en,
            type_uz: parsed.type.uz
        };

    const table = parsed.isCommercial ? "commercials" : "cardss";

    const { data, error } =
        await supabase.from(table).insert(insertData).select("id").single();

    if (error) {
        console.log("DB ERROR:", error);
        await replyToChannel(mainMsg, `❌ Не удалось сохранить объект: ${error.message}`);
        return;
    }

    const link = parsed.isCommercial ? `/commercial/${data.id}` : `/property/${data.id}`;
    await supabase.from(table).update({ link }).eq("id", data.id);

    const draftTable = parsed.isCommercial ? "commercial_pages" : "villas";
    const draftLinkField = parsed.isCommercial ? "commercial_id" : "card_id";
    const draftOk = await createDraftPage(draftTable, draftLinkField, data.id, parsed, images);

    const label = parsed.isCommercial ? "коммерция" : "жильё";

    let statusLine = parsed.missing.length
        ? `⚠️ Добавлено (${label}): «${parsed.title_ru}».\nНе распознано: ${parsed.missing.join(", ")} — проверьте и дозаполните в админ-панели.`
        : `✅ Добавлено (${label}): «${parsed.title_ru}» — ${parsed.price || "цена не указана"}`;

    statusLine += draftOk
        ? "\n📝 Черновик страницы объекта создан — откройте её в админке и дозаполните описание/удобства при необходимости."
        : "\n⚠️ Карточка создана, но черновик страницы объекта создать не удалось — заведите её вручную.";

    await replyToChannel(mainMsg, statusLine);
}


// Ищем альбомы, которые пора финализировать: подпись уже сохранена
// (caption не пустой), группа ещё не обработана, и с последнего
// добавленного фото прошло не меньше 10 секунд — то есть все фото
// альбома точно успели долететь и загрузиться.
const SETTLE_SECONDS = 10;

export default async function handler(req, res) {

    if (req.method !== "GET" && req.method !== "POST") {
        res.setHeader("Allow", "GET, POST");
        return res.status(405).json({ error: "Method not allowed" });
    }

    const secret = process.env.FINALIZE_SECRET;

    if (secret) {
        const provided = req.query?.secret || req.headers["x-finalize-secret"];
        if (provided !== secret) {
            return res.status(401).json({ error: "Invalid secret" });
        }
    }

    try {

        const cutoff = new Date(Date.now() - SETTLE_SECONDS * 1000).toISOString();

        const { data: candidates, error } = await supabase
            .from("bot_pending_albums")
            .select("media_group_id, chat_id, message_id, caption, has_video")
            .eq("processed", false)
            .not("caption", "is", null)
            .lt("updated_at", cutoff)
            .limit(20);

        if (error) {
            console.log("FINALIZE QUERY ERROR:", error);
            return res.status(500).json({ error: error.message });
        }

        if (!candidates?.length) {
            return res.status(200).json({ ok: true, processed: 0 });
        }

        let processedCount = 0;

        for (const row of candidates) {

            // атомарно "забираем" группу — если её уже кто-то забрал
            // (например, два последовательных запуска cron наложились
            // друг на друга), просто пропускаем
            const { data: claimed } = await supabase
                .from("bot_pending_albums")
                .update({ processed: true })
                .eq("media_group_id", row.media_group_id)
                .eq("processed", false)
                .select("images")
                .maybeSingle();

            if (!claimed) continue;

            // синтетическое "сообщение" — со всей информацией, которая
            // нужна processPost/replyToChannel (структура как у реального
            // объекта сообщения из Telegram Bot API)
            const syntheticMsg = {
                chat: { id: row.chat_id },
                message_id: row.message_id,
                caption: row.caption
            };

            try {
                await processPost(syntheticMsg, claimed.images || [], Boolean(row.has_video));
                processedCount++;
            } catch (e) {
                console.log("FINALIZE PROCESS POST ERROR:", row.media_group_id, e);
            }
        }

        return res.status(200).json({ ok: true, processed: processedCount, checked: candidates.length });

    } catch (e) {

        console.log("FINALIZE HANDLER EXCEPTION:", e);
        return res.status(500).json({ error: e.message });
    }
}
