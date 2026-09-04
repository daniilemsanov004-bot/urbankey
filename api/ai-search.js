// /api/ai-search — серверная точка для ИИ-поиска по каталогу.
//
// Человек пишет свободным текстом ("3-комнатная до $80k в Юнусабаде",
// "сниму офис в центре с ремонтом") — этот эндпоинт разбирает запрос
// через ту же цепочку провайдеров (api/aiProviders.js), что и разбор
// объявлений бота, в СТРУКТУРИРОВАННЫЕ фильтры (категория/тип/сделка/
// цена/спальни), САМ подтягивает подходящие объявления из Supabase
// (cardss_public/commercials_public — те же view и колонки, что
// использует src/Context.jsx) и возвращает готовый превью-список
// (до 6 карточек), чтобы src/components/AiSearchBar.jsx могло
// показать их прямо под строкой поиска, "а-ля Uzum" — без перехода на
// страницу каталога. Остаток текста, который не разложился в
// структурные фильтры (keywords), используется как мягкий ранжирующий
// сигнал (не жёсткий фильтр — иначе неточная формулировка могла бы
// давать "ничего не найдено" вместо ближайших вариантов).
//
// Полный список (не только превью) человек всё равно получает переходом
// на /Properties?q=... — та же логика фильтрации там продублирована на
// клиенте (src/components/Catalog.jsx), это осознанный компромисс:
// сама цепочка ИИ-провайдеров не дублируется (общий api/aiProviders.js),
// а вот процедура "применить готовые фильтры к списку объявлений"
// достаточно простая, чтобы недорого держать в двух местах (сервер —
// для быстрого превью, клиент — для полного списка с сортировкой/
// пагинацией/избранным, которые тут не нужны).
//
// Если ни один провайдер не ответил — возвращаем ok:false, фронт в
// этом случае просто переходит на каталог с исходным текстом как
// обычный текстовый поиск (никакого падения UX, ИИ тут — бонус, а не
// обязательное звено).

import { createClient } from "@supabase/supabase-js";
import { runListingAiChain } from "./aiProviders.js";

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_KEY
);

const CARD_COLUMNS =
    "id, title_ru, title_en, title_uz, description_ru, description_en, description_uz, " +
    "bedrooms_ru, type_ru, type_en, type_uz, price, image, link, is_rent";

const COMMERCIAL_COLUMNS =
    "id, title_ru, title_en, title_uz, description_ru, description_en, description_uz, " +
    "district_ru, class_ru, class_en, class_uz, price, image, is_rent";

const PREVIEW_LIMIT = 6;

const parsePriceValue = (price) => {
    if (!price) return null;
    const digits = String(price).replace(/[^\d]/g, "");
    return digits ? Number(digits) : null;
};

const parseFirstNumber = (text) => {
    if (!text) return null;
    const match = String(text).match(/\d+/);
    return match ? Number(match[0]) : null;
};

const RESIDENTIAL_TYPE_LABELS = {
    ru: ["Квартира", "Дом", "Новостройка"],
    en: ["Apartment", "House", "New building"],
    uz: ["Kvartira", "Uy", "Yangi qurilish"]
};

// AI возвращает "type" уже на языке запроса — для сравнения с БД
// (type_ru всегда заполнен, в отличие от type_en/type_uz, которые
// иногда пустые у старых объявлений) приводим обратно к русскому
// варианту по индексу в словаре.
const toRussianType = (label, lang) => {
    if (!label) return null;
    const dict = RESIDENTIAL_TYPE_LABELS[lang] || RESIDENTIAL_TYPE_LABELS.ru;
    const idx = dict.findIndex((l) => l.toLowerCase() === label.toLowerCase());
    return idx >= 0 ? RESIDENTIAL_TYPE_LABELS.ru[idx] : label;
};

// Мягкое ранжирование по keywords — не фильтр, а сортировочный вес:
// сколько раз слова из keywords встретились в title/description. Само
// по себе отсутствие совпадения не выкидывает объявление из списка
// (структурные фильтры уже сузили список достаточно) — просто у
// совпавших приоритет выше.
const keywordScore = (item, keywordsLower) => {
    if (!keywordsLower) return 0;
    const haystack = [
        item.title_ru, item.title_en, item.title_uz,
        item.description_ru, item.description_en, item.description_uz,
        item.district_ru
    ].filter(Boolean).join(" ").toLowerCase();

    return keywordsLower
        .split(/\s+/)
        .filter((w) => w.length > 1)
        .reduce((acc, word) => acc + (haystack.includes(word) ? 1 : 0), 0);
};

async function fetchPreviewResults(filters, lang) {

    const wantResidential = filters.category !== "commercial";
    const wantCommercial = filters.category !== "residential";

    const [cardsRes, commercialsRes] = await Promise.all([
        wantResidential
            ? supabase.from("cardss_public").select(CARD_COLUMNS).order("id", { ascending: false }).limit(200)
            : Promise.resolve({ data: [] }),
        wantCommercial
            ? supabase.from("commercials_public").select(COMMERCIAL_COLUMNS).order("id", { ascending: false }).limit(200)
            : Promise.resolve({ data: [] })
    ]);

    const russianType = toRussianType(filters.type, lang);
    const keywordsLower = (filters.keywords || "").trim().toLowerCase();

    let residential = (cardsRes.data || [])
        .filter((item) => !russianType || item.type_ru === russianType)
        .filter((item) => filters.dealType !== "rent" || item.is_rent === true)
        .filter((item) => filters.dealType !== "sale" || item.is_rent !== true)
        .filter((item) => {
            const p = parsePriceValue(item.price);
            if (filters.minPrice != null && (p == null || p < filters.minPrice)) return false;
            if (filters.maxPrice != null && (p == null || p > filters.maxPrice)) return false;
            return true;
        })
        .filter((item) => {
            if (filters.minBedrooms == null) return true;
            const beds = parseFirstNumber(item.bedrooms_ru);
            return beds != null && beds >= filters.minBedrooms;
        })
        .map((item) => ({
            id: item.id,
            category: "residential",
            title: item[`title_${lang}`] || item.title_ru,
            price: item.price,
            image: item.image,
            link: item.link || `/property/${item.id}`,
            isRent: item.is_rent === true,
            score: keywordScore(item, keywordsLower)
        }));

    let commercial = (commercialsRes.data || [])
        .filter((item) => filters.dealType !== "rent" || item.is_rent === true)
        .filter((item) => filters.dealType !== "sale" || item.is_rent !== true)
        .filter((item) => {
            const p = parsePriceValue(item.price);
            if (filters.minPrice != null && (p == null || p < filters.minPrice)) return false;
            if (filters.maxPrice != null && (p == null || p > filters.maxPrice)) return false;
            return true;
        })
        .map((item) => ({
            id: item.id,
            category: "commercial",
            title: item[`title_${lang}`] || item.title_ru,
            price: item.price,
            image: item.image,
            link: `/commercial/${item.id}`,
            isRent: item.is_rent === true,
            score: keywordScore(item, keywordsLower)
        }));

    return [...residential, ...commercial]
        .sort((a, b) => (b.score - a.score) || (b.id - a.id))
        .slice(0, PREVIEW_LIMIT)
        .map(({ score, ...rest }) => rest);
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 15; // запросов в минуту с одного IP — поиск не
// набирается на клавиатуре построчно (в отличие от /api/translate,
// который дёргается на каждое поле объявления), одного запроса на
// клик "Найти" достаточно, лимит просто выше, чем на пару опечаток.
const rateLimitStore = new Map();

const isRateLimited = (ip) => {

    const now = Date.now();
    const entry = rateLimitStore.get(ip);

    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitStore.set(ip, { windowStart: now, count: 1 });
        return false;
    }

    entry.count += 1;
    return entry.count > RATE_LIMIT_MAX;

};

const extraAllowedHosts = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);

const isAllowedOrigin = (req) => {

    const origin = req.headers.origin;

    if (!origin) return true;

    try {
        const host = new URL(origin).host;
        return host === req.headers.host || extraAllowedHosts.includes(host);
    } catch {
        return false;
    }

};

const SUPPORTED_LANGS = ["ru", "en", "uz"];
const MAX_QUERY_LENGTH = 300;

// Тот же словарь типов жилья используется чуть выше (toRussianType) и
// в src/components/Catalog.jsx (RESIDENTIAL_TYPE_LABELS) — Вилла/
// Коттедж/Резиденция/Пентхаус сознательно нет, в Ташкенте такого
// жилья у агентства не бывает.

const LANG_NAME = { ru: "русском", en: "английском", uz: "узбекском" };

const buildSystemPrompt = (langName) => `Ты разбираешь поисковый запрос пользователя сайта недвижимости в Ташкенте (агентство UrbanKey) на структурированные фильтры каталога.

Верни ТОЛЬКО валидный JSON без пояснений и markdown, по такой структуре:
{
  "category": "residential" | "commercial" | null,
  "type": string | null,
  "deal_type": "rent" | "sale" | null,
  "min_price": number | null,
  "max_price": number | null,
  "min_bedrooms": number | null,
  "keywords": string
}

Правила:
1. "category" — "residential" (жильё: квартира/дом/новостройка), "commercial" (офис/склад/магазин/помещение и т.п. коммерция), или null, если из запроса категория не ясна.
2. "type" — ТОЛЬКО если category="residential", одно из: "Квартира"/"Дом"/"Новостройка" (на языке ответа, см. ниже), иначе null. Не выдумывай другие типы — вилл/коттеджей/резиденций/пентхаусов у агентства в Ташкенте нет.
3. "deal_type" — "rent", если явно про аренду/съём ("сниму", "аренда", "хочу снять"), "sale" — если явно про покупку ("куплю", "продажа", "хочу купить"), иначе null. Не угадывай, если в запросе нет явного указания.
4. "min_price"/"max_price" — число в долларах США. "до 80k"/"до $80000"/"до 80 тысяч" -> max_price=80000. "от 50000" -> min_price=50000. "50-80 тысяч" -> оба. "к"/"k"/"тыс" после числа = ×1000.
5. "min_bedrooms" — число комнат, если указано ("2-комнатная" -> 2, "3+ комнаты" -> 3), иначе null.
6. "keywords" — всё остальное осмысленное из запроса, что НЕ разложилось в поля выше: район, название ЖК, особенности ("с ремонтом", "с мебелью", "у метро", "новый дом" и т.п.). Не дублируй туда то, что уже выражено в price/type/deal_type/bedrooms. Если ничего не осталось — пустая строка "".

Если что-то в запросе однозначно не определяется — оставляй null/"", не гадай. Значение "type" и "keywords" пиши на ${langName} языке.`;

const JSON_SCHEMA = {
    name: "catalog_search_filters",
    schema: {
        type: "object",
        properties: {
            category: { type: ["string", "null"] },
            type: { type: ["string", "null"] },
            deal_type: { type: ["string", "null"] },
            min_price: { type: ["number", "null"] },
            max_price: { type: ["number", "null"] },
            min_bedrooms: { type: ["number", "null"] },
            keywords: { type: "string" }
        },
        required: ["category", "type", "deal_type", "min_price", "max_price", "min_bedrooms", "keywords"],
        additionalProperties: false
    }
};

const GEMINI_SCHEMA = {
    type: "OBJECT",
    properties: {
        category: { type: "STRING", nullable: true },
        type: { type: "STRING", nullable: true },
        deal_type: { type: "STRING", nullable: true },
        min_price: { type: "NUMBER", nullable: true },
        max_price: { type: "NUMBER", nullable: true },
        min_bedrooms: { type: "NUMBER", nullable: true },
        keywords: { type: "STRING" }
    },
    required: ["category", "type", "deal_type", "min_price", "max_price", "min_bedrooms", "keywords"]
};

export default async function handler(req, res) {

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (!isAllowedOrigin(req)) {
        return res.status(403).json({ error: "Forbidden origin" });
    }

    const ip =
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        "unknown";

    if (isRateLimited(ip)) {
        return res.status(429).json({ error: "Too many requests, try again later" });
    }

    const { query, lang } = req.body || {};

    if (typeof query !== "string" || !query.trim()) {
        return res.status(400).json({ error: "query required" });
    }

    const safeQuery = query.trim().slice(0, MAX_QUERY_LENGTH);
    const safeLang = SUPPORTED_LANGS.includes(lang) ? lang : "ru";

    try {

        const result = await runListingAiChain({
            systemPrompt: buildSystemPrompt(LANG_NAME[safeLang]),
            jsonSchema: JSON_SCHEMA,
            geminiResponseSchema: GEMINI_SCHEMA,
            userText: safeQuery
        });

        if (!result.ok) {
            return res.status(200).json({ ok: false });
        }

        const data = result.data || {};

        // "type" приводим к КАНОНИЧЕСКОМУ написанию на нужном языке —
        // фильтру на фронте (Catalog.jsx) нужно точное совпадение со
        // значением, которое реально хранится у объявлений, а модель
        // иногда чуть перефразирует регистр/формулировку.
        const canonical = RESIDENTIAL_TYPE_LABELS[safeLang] || RESIDENTIAL_TYPE_LABELS.ru;
        let normalizedType = null;
        if (data.type) {
            const lower = String(data.type).trim().toLowerCase();
            normalizedType = canonical.find((label) => label.toLowerCase() === lower) || null;
        }

        const filters = {
            category: data.category === "residential" || data.category === "commercial" ? data.category : null,
            type: normalizedType,
            dealType: data.deal_type === "rent" || data.deal_type === "sale" ? data.deal_type : null,
            minPrice: typeof data.min_price === "number" && data.min_price >= 0 ? data.min_price : null,
            maxPrice: typeof data.max_price === "number" && data.max_price >= 0 ? data.max_price : null,
            minBedrooms: typeof data.min_bedrooms === "number" && data.min_bedrooms > 0 ? data.min_bedrooms : null,
            keywords: typeof data.keywords === "string" ? data.keywords.trim().slice(0, 200) : ""
        };

        let results = [];
        try {
            results = await fetchPreviewResults(filters, safeLang);
        } catch (e) {
            // Превью — бонус, а не обязательная часть ответа: если
            // Supabase недоступна/упала, всё равно отдаём фильтры, фронт
            // сможет применить их на странице каталога через ?q=.
            console.log("AI SEARCH: fetchPreviewResults failed:", e.message);
        }

        return res.status(200).json({
            ok: true,
            provider: result.provider,
            filters,
            results
        });

    } catch (e) {
        console.log("AI SEARCH ERROR:", e.message);
        return res.status(200).json({ ok: false });
    }

}
