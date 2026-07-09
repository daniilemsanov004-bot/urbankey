// /api/lead — единая серверная точка приёма заявок с сайта.
//
// Зачем это отдельная функция, а не прямой вызов Telegram с фронта:
//   1. Токен бота (TELEGRAM_BOT_TOKEN) живёт только тут, на сервере.
//      Раньше он лежал в VITE_TELEGRAM_TOKEN и попадал прямо в JS-бандл
//      сайта — то есть был виден каждому посетителю через devtools.
//   2. Тут же проверяется Cloudflare Turnstile (капча) и honeypot-поле,
//      чтобы боты не заваливали Telegram спамом.
//   3. Простейший rate-limit по IP + ограничение размера данных, чтобы
//      один клиент не мог долбить эндпоинт или прислать гигантский payload.
//   4. Проверка Origin — эндпоинт отвечает только на запросы с собственного
//      домена, а не с любого сайта в интернете, который решит на него дёргать.
//   5. Помимо Telegram — заявка сохраняется в таблицу leads в Supabase
//      (через service_role, в обход RLS), чтобы агентство вело её в
//      CRM-панели сайта со статусами (new/in_contact/deal/closed), а не
//      только видела разовое сообщение в Telegram.
//
// Нужные переменные окружения (задаются в Vercel Project Settings ->
// Environment Variables, БЕЗ префикса VITE_, чтобы Vite их не вкомпилировал
// в клиентский бандл):
//   TELEGRAM_BOT_TOKEN   — токен бота из @BotFather
//   TELEGRAM_CHAT_ID     — id чата/канала, куда слать заявки
//   TURNSTILE_SECRET_KEY — секретный ключ Turnstile (не sitekey!)
//   SUPABASE_URL         — обычно совпадает с VITE_SUPABASE_URL
//   SUPABASE_SERVICE_KEY — service_role ключ (Supabase Dashboard ->
//                          Project Settings -> API), НЕ anon-ключ
//   CRM_WEBHOOK_URL      — опционально: если задан, при сохранении заявки
//                          на этот адрес шлётся POST с её данными (для
//                          внешней CRM — amoCRM/Bitrix24/др., когда решите
//                          какую подключать)
//   CRM_TYPE             — опционально: "bitrix24" — форматирует запрос под
//                          REST-метод crm.lead.add Bitrix24. Без этой
//                          переменной (или с любым другим значением) шлётся
//                          обычный JSON — подходит для Zapier/Make/amoCRM
//                          inbound webhook и большинства других сервисов.
//
// ЧЕСТНО О ГРАНИЦАХ ЭТОЙ ЗАЩИТЫ:
//   - rate-limit ниже хранится в памяти процесса. На serverless это
//     best-effort: при холодном старте или нескольких параллельных
//     инстансах счётчик обнуляется/дублируется. Это не железная защита
//     от DDoS, а просто ещё один барьер поверх honeypot + капчи. Если
//     нужен настоящий rate-limit — это Vercel KV / Upstash Redis с
//     общим счётчиком между инстансами.
//   - Turnstile реально блокирует ботов только после того, как вы
//     впишете TURNSTILE_SECRET_KEY в Vercel. До этого момента капча
//     тихо пропускает всех — иначе форма была бы сломана "из коробки".
//   - Запись в Supabase и вызов CRM_WEBHOOK_URL — best-effort: если они
//     упадут, заявка всё равно уходит в Telegram и пользователь видит
//     "успешно" (Telegram — надёжный канал, который точно долетит).

import { createClient } from "@supabase/supabase-js";

const getSupabaseAdmin = () => {

    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) return null;

    return createClient(url, key, {
        auth: { persistSession: false }
    });

};

// ===== Форматы вебхука под разные CRM =====
//
// У большинства CRM (Zapier, Make, amoCRM inbound webhook) можно просто
// прислать произвольный JSON — это и есть "generic" формат ниже.
//
// У Bitrix24 так не работает: там нужен запрос конкретного вида к
// REST-методу crm.lead.add с полями в спец-формате (PHONE — массив
// объектов, а не строка, и т.п.). Чтобы потом просто вставить готовую
// ссылку вебхука из Bitrix24 и не трогать код — форматируем под него,
// когда явно указано CRM_TYPE=bitrix24.
//
// Как получить CRM_WEBHOOK_URL для Bitrix24:
//   Bitrix24 -> Разработчикам -> Другое -> Входящий вебхук
//   -> выдать право на CRM -> скопировать ссылку вида
//   https://ваш-портал.bitrix24.ru/rest/1/xxxxxxxxxxxxxxxx/
//   В Vercel добавить:
//     CRM_WEBHOOK_URL = <эта ссылка> + "crm.lead.add.json"
//     CRM_TYPE = bitrix24

const buildBitrix24Payload = (source, leadRow) => ({
    fields: {
        TITLE: `Заявка с сайта (${source})`,
        NAME: leadRow.name || "",
        PHONE: leadRow.phone ? [{ VALUE: leadRow.phone, VALUE_TYPE: "WORK" }] : undefined,
        COMMENTS: [
            leadRow.telegram ? `Telegram: ${leadRow.telegram}` : null,
            leadRow.message ? `Сообщение: ${leadRow.message}` : null
        ].filter(Boolean).join("\n"),
        SOURCE_DESCRIPTION: source
    },
    params: { REGISTER_SONET_EVENT: "Y" }
});

const notifyCrmWebhook = async (source, leadRow) => {

    const url = process.env.CRM_WEBHOOK_URL;

    if (!url) return;

    const crmType = (process.env.CRM_TYPE || "generic").toLowerCase();

    const payload = crmType === "bitrix24"
        ? buildBitrix24Payload(source, leadRow)
        : { source, ...leadRow };

    try {

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            console.error("CRM webhook responded with error status:", res.status, await res.text());
        }

    } catch (err) {
        console.error("CRM webhook error:", err);
    }

};

const saveLead = async (source, data) => {

    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
        console.warn("SUPABASE_SERVICE_KEY/SUPABASE_URL not set — lead not persisted to CRM table");
        return;
    }

    const leadRow = {
        type: "contact_form",
        source,
        name: data.name || data.Name || null,
        phone: data.phone || data.Phone || data.tel || null,
        telegram: data.telegram || data.Telegram || null,
        message: data.message || data.Message || null,
        raw_data: data
    };

    try {

        const { error } = await supabaseAdmin.from("leads").insert([leadRow]);

        if (error) {
            console.error("Failed to save lead to Supabase:", error);
            return;
        }

        if (!skipCrm) {
            await notifyCrmWebhook(source, leadRow);
        }

    } catch (err) {
        console.error("saveLead unexpected error:", err);
    }

};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const hits = new Map();

const isRateLimited = (ip) => {

    const now = Date.now();
    const entry = hits.get(ip);

    if (!entry || now - entry.start > RATE_LIMIT_WINDOW_MS) {
        hits.set(ip, { start: now, count: 1 });
        return false;
    }

    entry.count += 1;
    return entry.count > RATE_LIMIT_MAX;
};


// на каких доменах разрешено ставить эту форму. По умолчанию сравниваем
// Origin запроса с его же Host (это покрывает прод и все preview-деплои
// на Vercel — они всегда same-origin). Если нужно явно разрешить другие
// домены (например, отдельный поддомен) — перечислите их через запятую
// в переменной окружения ALLOWED_ORIGINS.
const extraAllowedHosts = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);

const isAllowedOrigin = (req) => {

    const origin = req.headers.origin;

    // часть браузерных сценариев (curl, серверные health-check'и) не шлют
    // Origin вовсе — не блокируем их тут, это не основная линия защиты
    if (!origin) return true;

    try {
        const host = new URL(origin).host;
        return host === req.headers.host || extraAllowedHosts.includes(host);
    } catch {
        return false;
    }
};


const verifyTurnstile = async (token, ip) => {

    const secret = process.env.TURNSTILE_SECRET_KEY;

    // если капча ещё не настроена на проекте — не блокируем форму,
    // просто пропускаем проверку (как и сам виджет на фронте в этом случае)
    if (!secret) return true;

    if (!token) return false;

    try {

        const res = await fetch(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    secret,
                    response: token,
                    remoteip: ip || ""
                })
            }
        );

        const data = await res.json();
        return Boolean(data.success);

    } catch (err) {
        console.error("Turnstile verify error:", err);
        return false;
    }
};


// белый список источников — чтобы в поле "source" нельзя было прислать
// что угодно (оно идёт прямо в текст сообщения в Telegram)
const ALLOWED_SOURCES = ["Connect", "Connect_one", "Happen", "Footer newsletter"];

const MAX_FIELDS = 15;
const MAX_FIELD_LENGTH = 1500;
const MAX_KEY_LENGTH = 60;

// проверяем и обрезаем данные формы, прежде чем класть их в сообщение —
// без этого можно было бы прислать 10 МБ текста в одном поле или
// сотни полей и раздуть/сломать запрос к Telegram
const sanitizeData = (data) => {

    const entries = Object.entries(data).slice(0, MAX_FIELDS);

    const clean = {};

    for (const [key, value] of entries) {

        if (typeof key !== "string" || key.length > MAX_KEY_LENGTH) continue;

        const strValue = String(value ?? "");

        clean[key] = strValue.length > MAX_FIELD_LENGTH
            ? strValue.slice(0, MAX_FIELD_LENGTH) + "…"
            : strValue;
    }

    return clean;
};


// человекочитаемое сообщение из произвольного объекта данных формы
const buildMessage = (source, data) => {

    const lines = Object.entries(data)
        .filter(([key]) => key !== "company") // honeypot никогда не идёт в сообщение
        .map(([key, value]) => `${key}: ${value || "-"}`);

    const text = `📩 Новая заявка (${source})\n\n${lines.join("\n")}`;

    // жёсткий лимит Telegram на длину сообщения — 4096 символов
    return text.length > 4000 ? text.slice(0, 4000) + "…" : text;
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

    const { source, data, captchaToken, company, skipCrm } = req.body || {};

    // honeypot: настоящие пользователи это поле не видят и не заполняют
    if (company) {
        // тихо "успешно" отвечаем спам-боту, чтобы не подсказывать,
        // что именно его вычислило
        return res.status(200).json({ ok: true });
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return res.status(400).json({ error: "Missing form data" });
    }

    const safeSource = ALLOWED_SOURCES.includes(source) ? source : "unknown";
    const safeData = sanitizeData(data);

    if (Object.keys(safeData).length === 0) {
        return res.status(400).json({ error: "Empty form data" });
    }

    const captchaOk = await verifyTurnstile(captchaToken, ip);

    if (!captchaOk) {
        return res.status(400).json({ error: "Captcha verification failed" });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        console.error("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not configured");
        return res.status(500).json({ error: "Server is not configured" });
    }

    try {

        const tgRes = await fetch(
            `https://api.telegram.org/bot${token}/sendMessage`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: buildMessage(safeSource, safeData)
                })
            }
        );

        if (!tgRes.ok) {
            const body = await tgRes.text();
            console.error("Telegram API error:", body);
            return res.status(502).json({ error: "Failed to deliver message" });
        }

        // best-effort: не блокируем ответ пользователю, если это упадёт —
        // Telegram-сообщение уже точно ушло
        saveLead(safeSource, safeData).catch((err) =>
            console.error("saveLead call failed:", err)
        );

        return res.status(200).json({ ok: true });

    } catch (err) {
        console.error("Lead submit error:", err);
        return res.status(500).json({ error: "Unexpected server error" });
    }
}
