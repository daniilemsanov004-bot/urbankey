// /api/ai-search — серверная точка для ИИ-поиска по каталогу.
//
// Человек пишет свободным текстом ("3-комнатная до $80k в Юнусабаде",
// "сниму офис в центре с ремонтом") — этот эндпоинт разбирает запрос
// через ту же цепочку провайдеров (api/aiProviders.js), что и разбор
// объявлений бота, в СТРУКТУРИРОВАННЫЕ фильтры (категория/тип/сделка/
// цена/спальни) + остаток текста как ключевые слова. Дальше
// src/components/AiSearchBar.jsx переходит на отдельную страницу
// каталога (/Properties?q=...) — точь-в-точь как поиск на Uzum
// открывает отдельную страницу результатов, а не выпадающую панель —
// и src/components/Catalog.jsx уже там применяет эти фильтры к
// имеющимся объявлениям (см. useSearchParams эффект и штатный
// fuzzy-поиск, src/utils/search.js, для остатка текста). Сам вызов ИИ
// живёт только здесь — на клиенте эта цепочка не дублируется.
//
// Если ни один провайдер не ответил — возвращаем ok:false, фронт в
// этом случае просто использует исходный текст запроса как обычный
// текстовый fuzzy-поиск (никакого падения UX, ИИ тут — бонус, а не
// обязательное звено).

import { runListingAiChain } from "./aiProviders.js";

const RESIDENTIAL_TYPE_LABELS = {
    ru: ["Квартира", "Дом", "Новостройка"],
    en: ["Apartment", "House", "New building"],
    uz: ["Kvartira", "Uy", "Yangi qurilish"]
};

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

        return res.status(200).json({
            ok: true,
            provider: result.provider,
            filters
        });

    } catch (e) {
        console.log("AI SEARCH ERROR:", e.message);
        return res.status(200).json({ ok: false });
    }

}
