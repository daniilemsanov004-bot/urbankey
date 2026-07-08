// /api/translate — серверная точка для автоперевода текстов объявления.
//
// ЗАЧЕМ ОТДЕЛЬНАЯ СЕРВЕРНАЯ ФУНКЦИЯ, А НЕ ПРЯМОЙ ВЫЗОВ ИЗ БРАУЗЕРА:
//   1. У сайта настроен строгий Content-Security-Policy (connect-src) —
//      прямой fetch на домен переводчика из браузера был бы заблокирован.
//      Так этот запрос идёт на свой же домен (/api/translate), а сервер
//      уже сам обращается наружу.
//   2. Если в будущем подключите платный переводчик (DeepL/Google Cloud
//      Translation с ключом) — ключ будет жить только тут, а не в
//      клиентском бандле.
//   3. Тут же — простейший rate-limit и проверка Origin, чтобы этим
//      эндпоинтом не пользовались как бесплатным прокси-переводчиком
//      с чужих сайтов.
//
// Пользователь на странице /add-property пишет объявление ОДИН раз на
// удобном ему языке (ru или uz) — этот эндпоинт переводит текст на
// оставшиеся языки, и в базу уходят все 3 варианта (ru/en/uz), как и
// раньше ожидают Villa/Property/Amenities и CommercialPage.
//
// Если сам переводчик недоступен (нет сети, сервис лёг) — функция
// возвращает ok:false по конкретному тексту, а фронт в этом случае
// просто использует исходный текст на всех языках (как раньше) —
// объявление всё равно публикуется, просто без перевода части полей.

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 20; // запросов в минуту с одного IP
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

const MAX_TEXTS = 25;
const MAX_TEXT_LENGTH = 2000;

// бесплатный (без ключа) публичный эндпоинт Google Translate —
// поддерживает ru/en/uz. Если решите подключить платный официальный
// Google Cloud Translation API или DeepL — достаточно поменять только
// эту функцию, интерфейс /api/translate для фронта останется тем же.
const translateOne = async (text, source, target) => {

    if (!text || !text.trim()) return "";
    if (source === target) return text;

    const url =
        "https://translate.googleapis.com/translate_a/single" +
        `?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;

    const res = await fetch(url);

    if (!res.ok) throw new Error(`translate upstream status ${res.status}`);

    const data = await res.json();

    // формат ответа: [[["перевод","оригинал",null,null,3], ...], null, "ru"]
    const translated = Array.isArray(data?.[0])
        ? data[0].map((chunk) => chunk?.[0] || "").join("")
        : "";

    if (!translated) throw new Error("empty translation result");

    return translated;

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

    const { source, targets, texts } = req.body || {};

    if (!SUPPORTED_LANGS.includes(source)) {
        return res.status(400).json({ error: "Unsupported source language" });
    }

    const cleanTargets = Array.isArray(targets)
        ? targets.filter((t) => SUPPORTED_LANGS.includes(t) && t !== source)
        : [];

    if (!cleanTargets.length) {
        return res.status(400).json({ error: "No valid target languages" });
    }

    if (!Array.isArray(texts) || !texts.length || texts.length > MAX_TEXTS) {
        return res.status(400).json({ error: "Invalid texts payload" });
    }

    // texts: [{ id: "title", text: "..." }, ...]
    const safeTexts = texts
        .filter((t) => t && typeof t.id === "string" && typeof t.text === "string")
        .map((t) => ({ id: t.id, text: t.text.slice(0, MAX_TEXT_LENGTH) }));

    const results = {};

    await Promise.all(
        safeTexts.map(async ({ id, text }) => {

            results[id] = { ok: true, [source]: text };

            await Promise.all(
                cleanTargets.map(async (target) => {

                    try {
                        results[id][target] = await translateOne(text, source, target);
                    } catch (err) {
                        console.error("TRANSLATE ERROR:", id, source, "->", target, err.message);
                        results[id].ok = false;
                        // graceful fallback — фронт всё равно получит
                        // валидное значение (исходный текст) вместо пустой строки
                        results[id][target] = text;
                    }

                })
            );

        })
    );

    return res.status(200).json({ results });

}
