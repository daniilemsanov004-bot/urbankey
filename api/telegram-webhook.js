// /api/telegram-webhook — принимает посты из Telegram-канала через
// webhook вместо long-polling. Работает как обычная serverless-функция
// на том же хостинге (Vercel), что и сайт — не нужен отдельный сервер
// и не нужно ничего запускать руками в терминале.
//
// Файл специально самодостаточный (без импорта из ../server/*) — Vercel
// не всегда корректно трассирует и включает в бандл функции файлы вне
// папки api/ в проектах без фреймворк-пресета (Vite/"Other"), из-за
// этого раньше падало с "Cannot find module '.../server/listingParser.js'".
// Импорт из api/aiProviders.js (соседний файл в этой же папке) — не та
// же проблема, Vercel такие относительные импорты внутри api/ трассирует
// нормально. Вся ОСТАЛЬНАЯ логика разбора поста (regex-парсер,
// переводы и т.п.) по-прежнему продублирована и здесь, и в
// server/listingParser.js (для polling-версии бота в server/bot.js) —
// при правках этой части меняйте оба файла одинаково.
//
// КАК ПОДКЛЮЧИТЬ (один раз, после деплоя):
//   1. В Vercel -> Settings -> Environment Variables добавьте:
//        PARSER_BOT_TOKEN         — токен вашего Telegram-бота
//        SUPABASE_SERVICE_KEY     — service_role ключ Supabase (НЕ тот,
//                                    что в VITE_SUPABASE_KEY на фронте!)
//        VITE_SUPABASE_URL        — уже должен быть настроен
//        TELEGRAM_WEBHOOK_SECRET  — придумайте любую случайную строку
//        GEMINI_API_KEY           — необязательно, но рекомендуется. Если
//                                    задан, разбор поста идёт через Google
//                                    Gemini (умнее и гибче под любой формат
//                                    текста, при этом бесплатный). Ключ
//                                    берётся на https://aistudio.google.com/apikey
//                                    без карты. Если не задан или запрос не
//                                    удался — автоматически используется
//                                    старый regex-парсер, работа не
//                                    остановится.
//        GEMINI_MODEL             — необязательно, по умолчанию
//                                    "gemini-3.6-flash".
//        GROQ_API_KEY             — необязательно, запасной вариант №1
//                                    (если Gemini не настроен/не ответил).
//                                    Ключ на https://console.groq.com/keys
//        OPENROUTER_API_KEY       — необязательно, запасной вариант №2.
//                                    Ключ на https://openrouter.ai/keys
//        MISTRAL_API_KEY          — необязательно, запасной вариант №3.
//                                    Ключ на https://console.mistral.ai/api-keys
//        SAMBANOVA_API_KEY        — необязательно, запасной вариант №4.
//                                    Ключ на https://cloud.sambanova.ai/apis
//        CLOUDFLARE_ACCOUNT_ID    — необязательно, запасной вариант №5
//                                    (последний в цепочке), вместе с
//                                    CLOUDFLARE_API_TOKEN. Account ID и
//                                    токен — в Cloudflare Dashboard →
//                                    Workers AI → Use REST API.
//        CLOUDFLARE_API_TOKEN     — см. CLOUDFLARE_ACCOUNT_ID выше.
//   2. Выполните sql/add_draft_flag.sql и sql/add_webhook_support.sql
//      в Supabase (один раз).
//   3. Скажите Telegram, куда слать посты (тоже один раз, с вашего
//      компьютера, curl или в браузере):
//
//      https://api.telegram.org/bot<PARSER_BOT_TOKEN>/setWebhook?url=https://ВАШ-ДОМЕН/api/telegram-webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>&allowed_updates=["channel_post","edited_channel_post"]
//
//      (замените <PARSER_BOT_TOKEN>, ВАШ-ДОМЕН и <TELEGRAM_WEBHOOK_SECRET>
//       на реальные значения; можно просто открыть эту ссылку в браузере)
//
//   После этого никакой терминал не нужен — Telegram сам стучится в
//   /api/telegram-webhook при каждом новом посте, и это работает всегда,
//   пока задеплоен сайт.

import { createClient } from "@supabase/supabase-js";
import { runListingAiChain } from "./aiProviders.js";


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

    m = text.match(/комнат\w*\s*[-:—]\s*(\d+)/i);
    if (m) return m[1];

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

    m = text.match(/площадь\D{0,35}?(\d+(?:[.,]\d+)?)/i);
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

    const floorM = text.match(/Этаж(?!ность)\s*[-:—]\s*(\d+)/i);
    const totalM = text.match(/Этажность\s*[-:—]\s*(\d+)/i);

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
// Аренда или продажа.
//
// "арендатор" (уже входит в COMMERCIAL_KEYWORDS выше — это про
// СУЩЕСТВУЮЩЕГО арендатора в помещении, признак коммерции с доходом, а
// не признак того, что САМ пост — предложение аренды) сюда специально
// не включаем, чтобы не путать с "сдам"/"сдаётся". Проверяем аренду
// ПЕРВОЙ (она обычно однозначнее по формулировкам "сдам"/"сдаётся"/
// "в аренду"), продажу — по остаточному принципу через отдельный список
// маркеров; если не нашлось ни одного явного маркера ни в одну, ни в
// другую сторону — считаем продажей (это исторически подавляющее
// большинство постов в канале).
const RENT_KEYWORDS =
    /сдам\b|сдаётся|сдается|сдаю\b|в\s*аренду|аренда\s+(?:на|от|помещени|квартир)|долгосрочн(?:ую|ая)\s+аренд|посуточно|ижарага|ijaraga|for\s*rent|rent(?:al)?\b/i;

const SALE_KEYWORDS =
    /продам\b|продаётся|продается|продажа|на\s*продажу|sotiladi|sotuvda|for\s*sale/i;

function detectIsRent(text) {
    if (RENT_KEYWORDS.test(text)) return true;
    if (SALE_KEYWORDS.test(text)) return false;
    return false;
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

    const isRent = detectIsRent(text);

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
        isRent,
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
// РАЗБОР ЧЕРЕЗ ИИ (опционально, если задан хотя бы один ключ провайдера)
//
// Один запрос на пост, строгий JSON-ответ по схеме. Модель обязана
// извлекать ТОЛЬКО то, что реально есть в тексте — никаких выдуманных
// удобств, дополненных описаний или "правдоподобных" цифр. Если что-то
// не упомянуто — соответствующее поле должно быть null/пустым, а не
// заполнено похожим на правду значением. Если запрос падает по любой
// причине (нет ключа, лимит, таймаут, невалидный JSON) — возвращаем null,
// и вызывающий код сам откатывается на regex-парсер (parseListing выше).
// =======================================================================

const AI_SYSTEM_PROMPT = `Ты — парсер объявлений о недвижимости. Тебе присылают сырой текст поста из Telegram-канала о продаже/аренде недвижимости в Узбекистане (обычно на русском, иногда со вставками на узбекском/английском). Извлеки структурированные данные СТРОГО по правилам ниже и верни JSON по заданной схеме.

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА:
1. Извлекай ТОЛЬКО то, что явно написано в тексте. Никогда не выдумывай, не додумывай и не предполагай информацию, которой нет в исходном тексте.
2. Если какого-то поля нет в тексте — верни null (для чисел/строк) или пустой массив (для списков). НЕ заполняй поле "правдоподобным" значением, даже если оно кажется типичным для такого объекта.
3. "amenities" (удобства) — ТОЛЬКО пункты, явно упомянутые в тексте, но категория ШИРЕ, чем просто "features": сюда входят и характеристики вроде качества ремонта или статуса новостройки. Примеры категорий (добавляй только то, что реально упомянуто, список не исчерпывающий — похожие по смыслу пункты тоже подходят): парковка, мебель, бытовая техника, кондиционер, лифт, детская площадка, тихий/зелёный двор, гардеробная, раздельный санузел, панорамный вид/окна, вид на город, охрана, консьерж, бассейн, терраса, балкон, стиральная машина, холодильник, телевизор, качество ремонта (дизайнерский/евроремонт/свежий ремонт), новостройка, система вентиляции и пожарной безопасности. Если про удобства вообще ничего не сказано — верни пустой массив. НИКОГДА не добавляй "стандартные" удобства, которых нет в тексте.
4. "title_ru" — короткий привлекательный заголовок объявления на основе типа объекта и его реальных характеристик из текста (район/ЖК, ключевая особенность и т.п.). Разрешены лёгкие маркетинговые слова и обороты для благозвучности ("уютная", "просторная", "с продуманной планировкой" и т.п.), даже если их не было в посте буквально — НО нельзя добавлять конкретные факты, которых нет в тексте (нельзя выдумывать площадь, кол-во комнат, ремонт, вид из окна и т.п., если это не упомянуто).
5. "description_ru" — пересказ ОСТАЛЬНОГО текста поста (без заголовка, без цены/этажа/площади, которые уже вынесены в отдельные поля, без телефона и имени агента) в приятном, продающем стиле, своими словами читателя объявления. Разрешены общие маркетинговые обороты и оценочные слова ("уютный", "продуманная планировка", "светлый", "тихий район" и т.п.), даже если их не было в посте дословно — стиль подачи можно улучшать. НО граница та же, что и для amenities выше: нельзя добавлять конкретные факты (удобства, точные характеристики, детали инфраструктуры), которых нет в исходном тексте — украшать можно только форму, не содержание. ВАЖНО: любой содержательный факт из текста, который не попал ни в одно отдельное поле (title/price/floor/area/district/address/landmark) и не подошёл под amenities, всё равно НЕ должен пропадать — включай его в description. Пустую строку возвращай только если буквально ничего не остаётся, кроме приветствия, контактов (телефон/имя агента/ссылки) и призыва к действию ("звоните", "пишите в директ" и т.п.) — если же в тексте есть хоть один содержательный факт (например, про ремонт, инфраструктуру, состояние объекта), он обязан попасть либо в amenities, либо в description, но не потеряться.
6. "description_en" и "description_uz" — переводы description_ru в том же продающем стиле (не дословный подстрочник, но и не более приукрашенные, чем сам description_ru — новых фактов добавлять нельзя).
7. "title_en" и "title_uz" — переводы title_ru тем же тоном.
8. Если пост вообще не про объект недвижимости (нет ни одной характеристики) — можешь оставить большинство полей null/пустыми.
9. "is_sold" = true ТОЛЬКО если в тексте явно сказано, что объект уже продан/сдан/снят с продажи (например: "ПРОДАНО", "уже сдано", "неактуально").
9a. "is_rent" = true, если объект сдаётся В АРЕНДУ (сдам/сдаётся/долгосрочная или посуточная аренда), false — если объект ПРОДАЁТСЯ. Если в тексте нет явного маркера ни в одну, ни в другую сторону — считай false (продажа), это подавляющее большинство постов в канале.
10. "price_raw" — цена ровно как в тексте (например "124 000 $", "83.000", "1400$ за 1м²"). "price_number" — то же самое, но как число в долларах, если валюта явно $ или это очевидно итоговая цена продажи. Если в тексте есть упоминание процента оплаты (например "при 100% оплате") — это НЕ цена, не перепутай это с суммой сделки. Если цена дана в сумах с курсом и отдельно указан итог в $ — используй именно итог в $.
11. "is_commercial" = true, если это коммерческая недвижимость (офис, склад, магазин, помещение под бизнес, отдельно стоящее здание и т.п.), false — если жильё (квартира/вилла/дом/коттедж).
12. "type_ru"/"type_en"/"type_uz" — категория ЖИЛЬЯ — используй ТОЛЬКО одно из трёх: Квартира/Apartment/Kvartira, Дом/House/Uy, Новостройка/New building/Yangi qurilish (последнее — если явно указано, что это новостройка/сдаваемый застройщиком объект, а не конкретный тип планировки; в остальных случаях по умолчанию Квартира). Другие слова вроде "вилла"/"коттедж"/"резиденция"/"пентхаус" НЕ используй как отдельную категорию — такого жилья на рынке недвижимости, с которым работает агентство, нет, приравнивай к Квартире. Категория — только если это жильё. Внимание: название ЖК может само содержать слово вроде "House" или "Villas" — ориентируйся на реальный смысл текста (например, слово "квартира" явно в тексте важнее названия ЖК). Если is_commercial=true, оставь эти поля null.
13. Никогда не копируй в description номер телефона, имя агента или ссылки на инстаграм/телеграм.
14. Формат текста строгий, единый для ЛЮБОЙ модели: title — одна строка без markdown (без **, #, эмодзи, кавычек-обёрток), не длиннее ~90 символов. description — связный абзац из 2–5 предложений обычным текстом, БЕЗ markdown, списков и эмодзи (если их не было в исходном посте).`;

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
            is_rent: { type: "boolean" },
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
            "is_commercial", "is_sold", "is_rent",
            "type_ru", "type_en", "type_uz",
            "price_raw", "price_number",
            "bedrooms", "bathrooms", "area", "floor", "total_floors", "ceiling_height",
            "district", "address", "landmark", "amenities"
        ],
        additionalProperties: false
    }
};

// Тот же список полей, что и AI_JSON_SCHEMA выше, но в диалекте Gemini
// (responseSchema): типы ЗАГЛАВНЫМИ ("STRING"/"OBJECT"/...), null-допустимые
// поля — через "nullable": true рядом с обычным type (Gemini не понимает
// type: ["string","null"], как у OpenAI), "additionalProperties" не
// поддерживается — просто убран. Смысл и набор полей — один в один с
// AI_JSON_SCHEMA, эту схему НЕ придумывали заново, только перевели формат.
const GEMINI_RESPONSE_SCHEMA = {
    type: "OBJECT",
    properties: {
        title_ru: { type: "STRING" },
        title_en: { type: "STRING" },
        title_uz: { type: "STRING" },
        description_ru: { type: "STRING" },
        description_en: { type: "STRING" },
        description_uz: { type: "STRING" },
        is_commercial: { type: "BOOLEAN" },
        is_sold: { type: "BOOLEAN" },
        is_rent: { type: "BOOLEAN" },
        type_ru: { type: "STRING", nullable: true },
        type_en: { type: "STRING", nullable: true },
        type_uz: { type: "STRING", nullable: true },
        price_raw: { type: "STRING", nullable: true },
        price_number: { type: "NUMBER", nullable: true },
        bedrooms: { type: "INTEGER", nullable: true },
        bathrooms: { type: "INTEGER", nullable: true },
        area: { type: "NUMBER", nullable: true },
        floor: { type: "INTEGER", nullable: true },
        total_floors: { type: "INTEGER", nullable: true },
        ceiling_height: { type: "NUMBER", nullable: true },
        district: { type: "STRING", nullable: true },
        address: { type: "STRING", nullable: true },
        landmark: { type: "STRING", nullable: true },
        amenities: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    ru: { type: "STRING" },
                    en: { type: "STRING" },
                    uz: { type: "STRING" }
                },
                required: ["ru", "en", "uz"]
            }
        }
    },
    required: [
        "title_ru", "title_en", "title_uz",
        "description_ru", "description_en", "description_uz",
        "is_commercial", "is_sold", "is_rent",
        "type_ru", "type_en", "type_uz",
        "price_raw", "price_number",
        "bedrooms", "bathrooms", "area", "floor", "total_floors", "ceiling_height",
        "district", "address", "landmark", "amenities"
    ]
};

// Приводим ответ ИИ к тому же виду, что возвращает parseListing() —
// дальше по коду (createDraftPage, processPost и т.д.) не нужно ничего
// менять, они просто получают готовый объект `parsed` из одного источника
// или другого.
// Нормализуем amenities: у Gemini строгая JSON-схема (responseSchema)
// гарантирует форму {ru,en,uz} для каждого пункта, а у остальных
// провайдеров в цепочке (Groq/OpenRouter/Mistral/SambaNova/Cloudflare)
// строгой схемы нет — только текстовое описание в промпте, и слабые/
// бесплатные модели иногда возвращают пункт просто строкой или под
// другими ключами. Без этой нормализации на сайте такой пункт
// показывался бы прочерком ("—"), как будто удобство есть, а текста
// у него нет.
function sanitizeAiText(text, maxLength) {

    if (!text) return "";

    let clean = String(text)
        .replace(/(\*\*|__)(.*?)\1/g, "$2")
        .replace(/(\*|_)(.*?)\1/g, "$2")
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/^[\s]*[-*•]\s+/gm, "")
        .replace(/\r?\n+/g, " ")
        .replace(/[ \t]{2,}/g, " ")
        .trim();

    if (maxLength && clean.length > maxLength) {
        clean = clean.slice(0, maxLength).replace(/\s+\S*$/, "").trim() + "…";
    }

    return clean;
}

function normalizeAmenities(rawAmenities) {

    if (!Array.isArray(rawAmenities)) return [];

    return rawAmenities
        .map((item) => {

            if (typeof item === "string") {
                const text = sanitizeAiText(item, 60);
                return text ? { ru: text, en: text, uz: text } : null;
            }

            if (item && typeof item === "object") {
                const ru = sanitizeAiText(item.ru || item.text || item.name, 60);
                const en = sanitizeAiText(item.en, 60);
                const uz = sanitizeAiText(item.uz, 60);
                if (!ru && !en && !uz) return null;
                return {
                    ru: ru || en || uz,
                    en: en || ru || uz,
                    uz: uz || ru || en
                };
            }

            return null;
        })
        .filter(Boolean);
}

// price_number от ИИ доверяем только если он в целом согласуется с
// тем, что можно детерминированно вытащить регэкспом из price_raw (той
// же priceToNumber, что использует regex-парсер выше). У провайдеров
// без строгой JSON-схемы (см. normalizeAmenities выше) изредка
// случается, что price_raw текст верный, а price_number — нет
// (сминаются с чем-то ещё цифры из поста). Если расхождение больше чем
// на порядок в любую сторону — считаем, что это как раз такой случай,
// и берём число из текста, а не то, что "досочинила" модель.
function reconcilePriceNumber(priceRaw, aiPriceNumber) {

    const fromText = priceToNumber(priceRaw);

    if (aiPriceNumber == null) return fromText;
    if (fromText == null || fromText === 0) return aiPriceNumber;

    const ratio = aiPriceNumber / fromText;
    if (ratio > 10 || ratio < 0.1) return fromText;

    return aiPriceNumber;
}

function verifyNumberInText(rawText, value) {

    if (value == null) return null;

    const num = String(value).trim();
    if (!num || !/^\d+([.,]\d+)?$/.test(num)) return value;

    const escaped = num.replace(".", "[.,]");
    const re = new RegExp(`(?<!\\d)${escaped}(?!\\d)`);

    return re.test(rawText) ? value : null;
}

function mapAiResultToParsed(ai, sourceText) {

    const isCommercial = Boolean(ai.is_commercial);

    const type = {
        ru: ai.type_ru || "Квартира",
        en: ai.type_en || "Apartment",
        uz: ai.type_uz || "Kvartira"
    };

    const verify = (value) => (sourceText ? verifyNumberInText(sourceText, value) : value);

    const vFloor = verify(ai.floor);
    const vCeiling = verify(ai.ceiling_height);
    const vArea = verify(ai.area);
    const vBedrooms = verify(ai.bedrooms);
    const vBathrooms = verify(ai.bathrooms);
    const vTotalFloors = verify(ai.total_floors);

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
        floor: vFloor != null ? String(vFloor) : "",
        ceiling: vCeiling != null ? String(vCeiling) : "",
        area: vArea != null ? String(vArea) : ""
    };

    const missing = [];
    if (!ai.title_ru) missing.push("название");
    if (!ai.price_raw) missing.push("цена");
    if (isCommercial) {
        if (vArea == null) missing.push("площадь");
    } else {
        if (vBedrooms == null) missing.push("кол-во комнат");
    }

    return {
        isCommercial,
        isSold: Boolean(ai.is_sold),
        isRent: Boolean(ai.is_rent),
        missing,
        title_ru: sanitizeAiText(ai.title_ru, 90) || "Квартира",
        title_en: sanitizeAiText(ai.title_en, 90),
        title_uz: sanitizeAiText(ai.title_uz, 90),
        description_ru: sanitizeAiText(ai.description_ru, 900),
        description_en: sanitizeAiText(ai.description_en, 900),
        description_uz: sanitizeAiText(ai.description_uz, 900),
        price: ai.price_raw || "",
        priceNumber: reconcilePriceNumber(ai.price_raw, ai.price_number),
        bedrooms: vBedrooms != null ? String(vBedrooms) : "",
        bathrooms: vBathrooms != null ? String(vBathrooms) : "",
        area: vArea != null ? String(vArea) : "",
        floor: vFloor != null ? String(vFloor) : "",
        totalFloors: vTotalFloors != null ? String(vTotalFloors) : "",
        locationLine: ai.district || ai.address || "",
        type,
        amenities: normalizeAmenities(ai.amenities),
        commercialFields
    };
}


// Цепочка ИИ-провайдеров (Gemini → Groq → OpenRouter → Mistral → SambaNova → Cloudflare)
// вынесена в общий модуль api/aiProviders.js — используется отсюда, из
// api/listingParser.js и из api/finalize-albums.js, чтобы список
// провайдеров и порядок фоллбэка не расходились по трём файлам.
async function parseWithAI(text) {

    const result = await runListingAiChain({
        systemPrompt: AI_SYSTEM_PROMPT,
        jsonSchema: AI_JSON_SCHEMA,
        geminiResponseSchema: GEMINI_RESPONSE_SCHEMA,
        userText: text
    });

    if (!result.ok) return null;

    console.log(`AI PARSE: сработал провайдер "${result.provider}"`);

    return mapAiResultToParsed(result.data, text);
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


// Telegram Bot API не даёт боту скачать файл больше 20 МБ (жёсткое
// ограничение самого Telegram, не наше) — если видео тяжелее, просто
// пропускаем его (возвращаем null), не ломая создание объекта.
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

function getVideoInfo(msg) {

    const video = msg.video || (msg.document?.mime_type?.startsWith("video/") ? msg.document : null);

    if (!video) return null;

    return {
        fileId: video.file_id,
        fileSize: video.file_size || 0
    };
}


async function uploadVideo(fileId) {

    try {

        const file = await bot_getFile(fileId);
        if (!file) return "";

        const url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;

        const response = await fetch(url);

        if (!response.ok) {
            console.log("VIDEO DOWNLOAD FAILED:", response.status);
            return "";
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.mp4`;

        const { error } =
            await supabase.storage
                .from("videos")
                .upload(fileName, buffer, { contentType: "video/mp4" });

        if (error) {
            console.log("VIDEO UPLOAD ERROR:", error);
            return "";
        }

        const { data } = supabase.storage.from("videos").getPublicUrl(fileName);
        return data.publicUrl;

    } catch (e) {

        console.log("VIDEO UPLOAD EXCEPTION:", e);
        return "";
    }
}


async function bot_getFile(fileId) {

    const fileResp = await telegramApi("getFile", { file_id: fileId });

    if (!fileResp.ok) return null;

    return fileResp.result;
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


async function createDraftPage(table, linkIdField, cardId, parsed, images, videoUrl) {

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
            video: videoUrl || "",
            amenities: parsed.amenities || [],
            is_rent: Boolean(parsed.isRent),

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
                // жилья (Квартира/Вилла/Дом), он тут не подходит по смыслу
                // (не "Квартира" же). class_* — то самое поле "Категория"
                // на сайте (см. CommercialHero.jsx text("class")) — по
                // прямому запросу ставим фиксированное "Коммерция", а не
                // пусто. type_ru/en/uz оставляем пустыми — они здесь ни на
                // что не влияют (в отличие от жилых объектов, где type
                // приходит из словаря Квартира/Вилла/Дом).
                type_ru: "",
                type_en: "",
                type_uz: "",
                class_ru: "Коммерция",
                class_en: "Commercial",
                class_uz: "Tijorat",
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


async function processPost(mainMsg, images, videoUrl) {

    const image = images[0] || "";
    const hasVideo = Boolean(videoUrl);

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
        video: videoUrl || "",
        price: parsed.price,
        is_rent: Boolean(parsed.isRent),
        tg_chat_id: mainMsg.chat.id,
        tg_message_id: mainMsg.message_id
    };

    const insertData = parsed.isCommercial
        ? {
            ...baseFields,
            ...parsed.commercialFields,
            // Тот же хардкод "Коммерция", что и в createDraftPage (для
            // альбомов) — тут отдельная, более простая ветка для постов
            // с ОДНИМ фото, которая эти поля раньше не трогала вообще
            // (оставались NULL/пустыми — отсюда была пустая "Категория"
            // на сайте для таких постов).
            class_ru: "Коммерция",
            class_en: "Commercial",
            class_uz: "Tijorat"
        }
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
    const draftOk = await createDraftPage(draftTable, draftLinkField, data.id, parsed, images, videoUrl);

    const label = parsed.isCommercial ? "коммерция" : "жильё";

    let statusLine = parsed.missing.length
        ? `⚠️ Добавлено (${label}): «${parsed.title_ru}».\nНе распознано: ${parsed.missing.join(", ")} — проверьте и дозаполните в админ-панели.`
        : `✅ Добавлено (${label}): «${parsed.title_ru}» — ${parsed.price || "цена не указана"}`;

    statusLine += draftOk
        ? "\n📝 Черновик страницы объекта создан — откройте её в админке и дозаполните описание/удобства при необходимости."
        : "\n⚠️ Карточка создана, но черновик страницы объекта создать не удалось — заведите её вручную.";

    await replyToChannel(mainMsg, statusLine);
}


async function processEditedPost(msg) {

    const text = msg.caption || msg.text || "";
    const parsed = await getParsedListing(text);

    await fillMissingTranslations(parsed, ["title", "description"]);
    if (parsed.isCommercial) {
        await fillMissingTranslations(parsed.commercialFields, ["district", "address", "landmark"]);
    }

    const lookup = async (table) => {
        const { data } = await supabase
            .from(table)
            .select("id")
            .eq("tg_chat_id", msg.chat.id)
            .eq("tg_message_id", msg.message_id)
            .maybeSingle();
        return data;
    };

    const cardMatch = await lookup("cardss");
    const commercialMatch = cardMatch ? null : await lookup("commercials");

    const table = cardMatch ? "cardss" : (commercialMatch ? "commercials" : null);
    const id = cardMatch?.id || commercialMatch?.id;

    if (!table) {
        await replyToChannel(
            msg,
            "✏️ Пост отредактирован, но карточка на сайте не найдена (возможно, была создана до подключения вебхука) — поправьте объект вручную в админ-панели."
        );
        return;
    }

    const updateData = parsed.isCommercial
        ? {
            title_ru: parsed.title_ru, title_en: parsed.title_en, title_uz: parsed.title_uz,
            description_ru: parsed.description_ru, description_en: parsed.description_en, description_uz: parsed.description_uz,
            price: parsed.price,
            is_rent: Boolean(parsed.isRent),
            class_ru: "Коммерция",
            class_en: "Commercial",
            class_uz: "Tijorat",
            ...parsed.commercialFields
        }
        : {
            title_ru: parsed.title_ru, title_en: parsed.title_en, title_uz: parsed.title_uz,
            description_ru: parsed.description_ru, description_en: parsed.description_en, description_uz: parsed.description_uz,
            price: parsed.price,
            is_rent: Boolean(parsed.isRent),
            bedrooms_ru: parsed.bedrooms ? `${parsed.bedrooms} спальни` : "",
            bedrooms_en: parsed.bedrooms ? `${parsed.bedrooms} bedrooms` : "",
            bedrooms_uz: parsed.bedrooms ? `${parsed.bedrooms} yotoqxona` : "",
            bathrooms_ru: parsed.bathrooms ? `${parsed.bathrooms} ванные` : "",
            bathrooms_en: parsed.bathrooms ? `${parsed.bathrooms} bathrooms` : "",
            bathrooms_uz: parsed.bathrooms ? `${parsed.bathrooms} hammom` : "",
            type_ru: parsed.type.ru, type_en: parsed.type.en, type_uz: parsed.type.uz
        };

    const editFileId = getBestImageFileId(msg);
    if (editFileId) {
        updateData.image = await uploadPhoto(editFileId);
    }

    const { error } = await supabase.from(table).update(updateData).eq("id", id);

    if (error) {
        await replyToChannel(msg, `❌ Не удалось обновить объект: ${error.message}`);
        return;
    }

    await replyToChannel(msg, `✏️ Объект «${parsed.title_ru}» обновлён на сайте`);
}


// Ждёт, пока список фото альбома в bot_pending_albums перестанет расти
// (два замера подряд с одинаковым количеством), вместо того чтобы ждать
// фиксированное время — большие альбомы (7-8 фото) с реальной сетевой
// задержкой на скачивание/загрузку каждого фото могут не укладываться в
// произвольно выбранную паузу. Потолок в 9 секунд — на случай, если
// какое-то фото так и не долетит, чтобы не ждать вечно.
async function handleAlbumMessage(msg) {

    const groupId = String(msg.media_group_id);
    const text = msg.caption || msg.text || "";
    const ownFileId = getBestImageFileId(msg);

    // проверяем, не обработана ли уже эта группа (чтобы не создать вторую карточку)
    const { data: existing } = await supabase
        .from("bot_pending_albums")
        .select("processed")
        .eq("media_group_id", groupId)
        .maybeSingle();

    if (existing?.processed) {
        return;
    }

    if (ownFileId) {

        const uploaded = await uploadPhoto(ownFileId);

        if (uploaded) {
            // append_album_image добавляет фото в общий список атомарно на
            // стороне базы (и обновляет updated_at) — это защищает от
            // гонки, когда несколько фото альбома прилетают почти
            // одновременно отдельными вызовами функции
            const { error: rpcError } = await supabase.rpc(
                "append_album_image",
                { p_media_group_id: groupId, p_image: uploaded }
            );

            if (rpcError) {
                console.log("APPEND ALBUM IMAGE ERROR:", rpcError);
            }
        }
    }

    const videoInfo = getVideoInfo(msg);

    if (videoInfo) {

        if (videoInfo.fileSize && videoInfo.fileSize > MAX_VIDEO_BYTES) {

            await replyToChannel(msg, "⚠️ Видео в альбоме больше 20 МБ — Telegram не даёт боту скачать такой файл, оно будет пропущено.");

        } else {

            const videoUrl = await uploadVideo(videoInfo.fileId);

            if (videoUrl) {
                await supabase
                    .from("bot_pending_albums")
                    .update({ video: videoUrl, updated_at: new Date().toISOString() })
                    .eq("media_group_id", groupId);
            }
        }
    }

    if (!text.trim()) {
        // текста в этом сообщении нет — фото (если было) уже сохранено
        // функцией выше, просто ждём сообщение с текстом
        return;
    }

    // Раньше именно этот запрос дальше сам ждал, пока долетят остальные
    // фото альбома, и сам же создавал объект — для больших альбомов
    // (7-8 фото) это оказалось ненадёжно. Теперь просто сохраняем текст
    // и данные о сообщении — объект создаст отдельная задача по
    // расписанию (api/finalize-albums.js, дёргается Vercel Cron), когда
    // увидит, что в группу какое-то время не добавлялись новые фото.
    const { error: saveError, data: saveData } = await supabase
        .from("bot_pending_albums")
        .update({
            chat_id: msg.chat.id,
            message_id: msg.message_id,
            caption: text
        })
        .eq("media_group_id", groupId)
        .select("media_group_id");

    if (saveError) {
        console.log("SAVE CAPTION ERROR:", saveError);
    } else {
        console.log("SAVE CAPTION OK, affected rows:", saveData?.length, "groupId:", groupId);
    }
}


export default async function handler(req, res) {

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (WEBHOOK_SECRET) {
        const provided = req.headers["x-telegram-bot-api-secret-token"];
        if (provided !== WEBHOOK_SECRET) {
            return res.status(401).json({ error: "Invalid secret token" });
        }
    }

    const update = req.body || {};

    try {

        const msg = update.channel_post;
        const editedMsg = update.edited_channel_post;

        if (editedMsg) {

            // Если подпись у альбома добавили/поменяли уже ПОСЛЕ отправки
            // фото (через "редактировать" в Telegram) — это прилетает как
            // edited_channel_post, а не обычным сообщением. Если для этой
            // группы ещё нет обработанной карточки — сохраняем подпись
            // туда же, куда обычно (bot_pending_albums), чтобы
            // finalize-albums её подхватил. Если карточка уже есть —
            // работает как обычное редактирование (см. processEditedPost).
            if (editedMsg.media_group_id) {

                const groupId = String(editedMsg.media_group_id);
                const editText = editedMsg.caption || editedMsg.text || "";

                if (editText.trim()) {

                    const { data: pending } = await supabase
                        .from("bot_pending_albums")
                        .select("processed")
                        .eq("media_group_id", groupId)
                        .maybeSingle();

                    if (pending && !pending.processed) {

                        await supabase
                            .from("bot_pending_albums")
                            .update({
                                chat_id: editedMsg.chat.id,
                                message_id: editedMsg.message_id,
                                caption: editText
                            })
                            .eq("media_group_id", groupId);

                        return res.status(200).json({ ok: true });
                    }
                }
            }

            await processEditedPost(editedMsg);
            return res.status(200).json({ ok: true });
        }

        if (!msg) return res.status(200).json({ ok: true });

        const text = msg.caption || msg.text || "";
        const videoInfo = getVideoInfo(msg);

        if (!text.trim() && !getBestImageFileId(msg) && !videoInfo) {
            return res.status(200).json({ ok: true });
        }

        if (msg.media_group_id) {
            await handleAlbumMessage(msg);
            return res.status(200).json({ ok: true });
        }

        const mainFileId = getBestImageFileId(msg);
        const image = mainFileId ? await uploadPhoto(mainFileId) : "";

        let videoUrl = "";
        if (videoInfo) {
            if (videoInfo.fileSize && videoInfo.fileSize > MAX_VIDEO_BYTES) {
                await replyToChannel(msg, "⚠️ Видео больше 20 МБ — Telegram не даёт боту скачать такой файл. Объект будет создан без видео, добавьте его вручную при желании.");
            } else {
                videoUrl = await uploadVideo(videoInfo.fileId);
            }
        }

        await processPost(msg, image ? [image] : [], videoUrl);

        return res.status(200).json({ ok: true });

    } catch (e) {

        console.log("WEBHOOK HANDLER EXCEPTION:", e);
        // всё равно отвечаем 200, чтобы Telegram не долбил повторно
        // одним и тем же апдейтом до бесконечности
        return res.status(200).json({ ok: true });
    }
}