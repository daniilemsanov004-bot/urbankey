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

export function detectType(text) {

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




// ---------------------------------------------------------------------
// Удобства/оснащение — по ключевым словам в тексте поста. Без ИИ, чисто
// по словарю: находим упоминание — добавляем готовый пункт сразу на
// трёх языках (перевод тут не нужен, т.к. формулировки фиксированные).
// Список не претендует на полноту — расширяйте по мере встречающихся
// в постах формулировок.
// ---------------------------------------------------------------------
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

export function extractAmenities(text) {

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

export function extractRooms(text) {

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
export function extractArea(text) {

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
export function extractFloorInfo(text) {

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
export function extractLocationLine(text) {

    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const line = lines.find(l => l.includes("📍"));

    if (!line) return "";

    return line
        .replace(/📍/g, "")
        .replace(/^Адрес\s*:\s*/i, "")
        .trim();
}




// ---------------------------------------------------------------------
// Цена. Любой разделитель после метки ("Цена:", "Стоимость;", "Цена —"),
// актуальная цена вместо зачёркнутой старой.
//
// Отдельная сложность: посты часто дают цену в сумах с курсом и итогом
// в $ на отдельной строке ("8 659 000 000 сум/12000=722.000$"), а рядом
// может быть "Цена при 100% оплате" — где "100" это процент, а не цена.
// Поэтому сначала ищем явную сумму в $ где угодно в тексте (это почти
// всегда и есть актуальная цена), и только если её нет — ищем по метке,
// предварительно вырезав упоминания процентов.
// ---------------------------------------------------------------------
export function extractPrice(text) {

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
export function priceToNumber(raw) {

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

export function isCommercialPost(text) {
    return COMMERCIAL_KEYWORDS.test(text);
}




// ---------------------------------------------------------------------
// Автоперевод. Бесплатный публичный эндпоинт Google Translate — тот же,
// что уже используется в /api/translate на сайте. Без ключа, без ИИ.
// ---------------------------------------------------------------------
export async function translateText(text, source, target) {

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
export async function fillMissingTranslations(fieldsObj, bases) {

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

export function slugify(str) {
    return (
        transliterate(str || "listing")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 60)
    ) || "listing";
}




// ---------------------------------------------------------------------
// Описание по умолчанию — когда в посте нет ручных маркеров RU_DESC:/
// EN_DESC:/UZ_DESC:. Раньше без маркеров description_ru всегда оставался
// пустым, хотя в самом посте есть нормальный связный текст — просто
// берём все содержательные строки (кроме заголовка и служебных строк
// вроде "Цена:"/"Этаж:") и убираем строки-контакты (телефон/имя).
// ---------------------------------------------------------------------
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
export function parseListing(text) {

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
