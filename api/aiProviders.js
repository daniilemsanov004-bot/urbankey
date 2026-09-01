// Общая цепочка ИИ-провайдеров для разбора объявлений — один и тот же
// список используется в api/listingParser.js, api/finalize-albums.js и
// api/telegram-webhook.js (раньше каждый файл держал свою копию
// parseWithGemini/parseWithOpenAI — теперь это здесь, в одном месте).
//
// Порядок и подход в целом как в tashkent-apartments-v2
// (scraper/src/aiProviders.js), но набор провайдеров подобран отдельно
// под этот проект:
//   1. Gemini      — бесплатный, приоритет
//   2. Groq         — бесплатный/дешёвый, OpenAI-совместимый API
//   3. OpenRouter   — доступ к куче моделей сразу через один ключ
//   4. Mistral      — OpenAI-совместимый API (api.mistral.ai)
//   5. SambaNova    — OpenAI-совместимый API (api.sambanova.ai)
//   6. Cloudflare Workers AI — отдельный формат API (не /chat/completions,
//                      а /accounts/{id}/ai/run/{model}), последний в
//                      цепочке
//
// OpenAI, Anthropic Claude и Cerebras сознательно не используются здесь
// (были предложены как варианты в процессе — убраны/заменены по
// прямому запросу).
//
// Если провайдер не настроен (нет ключа в .env) — он просто
// пропускается. Если настроен, но упал (таймаут, невалидный JSON,
// ошибка API) — пишем в лог и переходим к следующему. Если ни один не
// сработал — возвращаем null, вызывающий код сам откатывается на
// регекс-парсер (parseListing).

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || "mistral-small-latest";

const SAMBANOVA_API_KEY = process.env.SAMBANOVA_API_KEY;
const SAMBANOVA_MODEL = process.env.SAMBANOVA_MODEL || "Meta-Llama-3.3-70B-Instruct";

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_MODEL = process.env.CLOUDFLARE_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

const DEFAULT_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 20000;
const GEMINI_RETRYABLE_STATUSES = new Set([429, 503]);
const GEMINI_RETRY_DELAYS_MS = [1200, 2500];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Groq/OpenRouter/Mistral/SambaNova иногда оборачивают JSON в
// ```-фенсы, даже если попросить json_object — подчищаем перед
// парсингом, как в scraper/src/aiProviders.js.
function cleanJsonText(text) {
    const raw = String(text || "").trim();
    const noFence = raw.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
    const start = noFence.indexOf("{");
    const end = noFence.lastIndexOf("}");
    if (start >= 0 && end > start) return noFence.slice(start, end + 1).trim();
    return noFence;
}

async function callGemini(systemPrompt, geminiResponseSchema, userText) {

    for (let attempt = 0; attempt <= GEMINI_RETRY_DELAYS_MS.length; attempt++) {

        const controller = new AbortController();
        let timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

        try {

            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        system_instruction: { parts: [{ text: systemPrompt }] },
                        contents: [{ parts: [{ text: userText }] }],
                        generationConfig: {
                            temperature: 0,
                            responseMimeType: "application/json",
                            responseSchema: geminiResponseSchema
                        }
                    }),
                    signal: controller.signal
                }
            );

            clearTimeout(timeout);

            if (!res.ok) {

                const errBody = await res.text();

                if (GEMINI_RETRYABLE_STATUSES.has(res.status) && attempt < GEMINI_RETRY_DELAYS_MS.length) {
                    console.log(`GEMINI API ERROR (retryable, попытка ${attempt + 1}/${GEMINI_RETRY_DELAYS_MS.length + 1}):`, res.status, errBody);
                    await sleep(GEMINI_RETRY_DELAYS_MS[attempt]);
                    continue;
                }

                console.log("GEMINI API ERROR:", res.status, errBody);
                return null;
            }

            const data = await res.json();
            const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!raw) {
                console.log("GEMINI: пустой ответ");
                return null;
            }

            return JSON.parse(raw);

        } catch (e) {

            clearTimeout(timeout);
            console.log("GEMINI PARSE EXCEPTION:", e.message);
            return null;
        }
    }

    return null;
}

// Groq/OpenRouter/Mistral/SambaNova — все говорят по OpenAI-совместимому
// /chat/completions, но, в отличие от OpenAI, не поддерживают строгую
// json_schema (structured outputs) — просим json_object и подчищаем
// ответ cleanJsonText на случай ```-фенсов или лишнего текста вокруг.
async function callOpenAICompatible({ providerName, baseUrl, apiKey, model, systemPrompt, userText, extraHeaders = {} }) {

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {

        const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                ...extraHeaders
            },
            body: JSON.stringify({
                model,
                temperature: 0,
                response_format: { type: "json_object" },
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userText }
                ]
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!res.ok) {
            console.log(`${providerName.toUpperCase()} API ERROR:`, res.status, await res.text());
            return null;
        }

        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content;

        if (!raw) {
            console.log(`${providerName.toUpperCase()}: пустой ответ`);
            return null;
        }

        return JSON.parse(cleanJsonText(raw));

    } catch (e) {

        clearTimeout(timeout);
        console.log(`${providerName.toUpperCase()} PARSE EXCEPTION:`, e.message);
        return null;
    }
}

// Cloudflare Workers AI — свой формат эндпоинта
// (/client/v4/accounts/{id}/ai/run/{model}, а не /chat/completions),
// заголовок Authorization: Bearer с API-токеном (не ключ модели).
// Отвечает { success, result: { response } }, а не { choices: [...] },
// как у OpenAI-совместимых — поэтому отдельная функция, не через
// callOpenAICompatible.
async function callCloudflare(systemPrompt, userText) {

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {

        const res = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${CLOUDFLARE_MODEL}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`
                },
                body: JSON.stringify({
                    temperature: 0,
                    messages: [
                        {
                            role: "system",
                            content: `${systemPrompt}\n\nОтвечай СТРОГО валидным JSON-объектом по описанной структуре, без пояснений и без markdown-разметки (без \`\`\`).`
                        },
                        { role: "user", content: userText }
                    ]
                }),
                signal: controller.signal
            }
        );

        clearTimeout(timeout);

        if (!res.ok) {
            console.log("CLOUDFLARE API ERROR:", res.status, await res.text());
            return null;
        }

        const data = await res.json();

        if (!data.success) {
            console.log("CLOUDFLARE API ERROR (success:false):", JSON.stringify(data.errors));
            return null;
        }

        const raw = data.result?.response;

        if (!raw) {
            console.log("CLOUDFLARE: пустой ответ");
            return null;
        }

        return JSON.parse(cleanJsonText(raw));

    } catch (e) {

        clearTimeout(timeout);
        console.log("CLOUDFLARE PARSE EXCEPTION:", e.message);
        return null;
    }
}

// Публичная функция цепочки: пробует провайдеров по очереди — Gemini →
// Groq → OpenRouter → Mistral → SambaNova → Cloudflare Workers AI — и
// возвращает JSON от первого, кто успешно ответил (плюс имя сработавшего провайдера,
// на случай если понадобится для логов/отладки). Провайдер без ключа в
// .env просто пропускается. Если не сработал ни один — { ok: false }.
// Нужно снаружи (finalize-albums.js) для троттлинга между вызовами:
// у бесплатного тира Gemini низкий лимит запросов/мин, у остальных
// провайдеров в цепочке — нет (или он намного выше), так что паузу
// имеет смысл включать только когда реально может сработать Gemini.
export function isGeminiConfigured() {
    return Boolean(GEMINI_API_KEY);
}

export async function runListingAiChain({ systemPrompt, jsonSchema, geminiResponseSchema, userText }) {

    if (GEMINI_API_KEY) {
        const data = await callGemini(systemPrompt, geminiResponseSchema, userText);
        if (data) return { ok: true, provider: "gemini", data };
    }

    if (GROQ_API_KEY) {
        const data = await callOpenAICompatible({
            providerName: "groq",
            baseUrl: "https://api.groq.com/openai/v1",
            apiKey: GROQ_API_KEY,
            model: GROQ_MODEL,
            systemPrompt,
            userText
        });
        if (data) return { ok: true, provider: "groq", data };
    }

    if (OPENROUTER_API_KEY) {
        const data = await callOpenAICompatible({
            providerName: "openrouter",
            baseUrl: "https://openrouter.ai/api/v1",
            apiKey: OPENROUTER_API_KEY,
            model: OPENROUTER_MODEL,
            systemPrompt,
            userText,
            extraHeaders: {
                "HTTP-Referer": "https://urbankey.uz",
                "X-Title": "UrbanKey listing parser"
            }
        });
        if (data) return { ok: true, provider: "openrouter", data };
    }

    if (MISTRAL_API_KEY) {
        const data = await callOpenAICompatible({
            providerName: "mistral",
            baseUrl: "https://api.mistral.ai/v1",
            apiKey: MISTRAL_API_KEY,
            model: MISTRAL_MODEL,
            systemPrompt,
            userText
        });
        if (data) return { ok: true, provider: "mistral", data };
    }

    if (SAMBANOVA_API_KEY) {
        const data = await callOpenAICompatible({
            providerName: "sambanova",
            baseUrl: "https://api.sambanova.ai/v1",
            apiKey: SAMBANOVA_API_KEY,
            model: SAMBANOVA_MODEL,
            systemPrompt,
            userText
        });
        if (data) return { ok: true, provider: "sambanova", data };
    }

    if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN) {
        const data = await callCloudflare(systemPrompt, userText);
        if (data) return { ok: true, provider: "cloudflare", data };
    }

    return { ok: false, provider: null, data: null };
}
