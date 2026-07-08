// Помощник для автоперевода текстов объявления через /api/translate.
//
// Пользователь пишет объявление один раз на удобном ему языке (ru/uz/en),
// а это функция переводит указанные поля на оставшиеся языки и
// возвращает объект { [fieldId]: { ru, en, uz } } — готовый для вставки
// в cardss/villas/commercials/commercial_pages, где каждое текстовое
// поле хранится сразу на 3 языках (title_ru/title_en/title_uz и т.п.)

export const SUPPORTED_LISTING_LANGS = ["ru", "en", "uz"];

// fields: { fieldId: text }
// возвращает: { fieldId: { ru, en, uz } } — на исходном языке всегда
// оригинальный текст, на остальных — перевод (или тот же текст, если
// переводчик оказался недоступен, чтобы объявление в любом случае ушло)
export const translateFields = async (source, fields) => {

    const targets = SUPPORTED_LISTING_LANGS.filter((l) => l !== source);

    const entries = Object.entries(fields).filter(
        ([, text]) => text != null && String(text).trim() !== ""
    );

    const buildFallback = () => {
        const out = {};
        for (const [id, text] of entries) {
            out[id] = { [source]: String(text) };
            targets.forEach((t) => { out[id][t] = String(text); });
        }
        return out;
    };

    if (!entries.length) return {};

    try {

        const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                source,
                targets,
                texts: entries.map(([id, text]) => ({ id, text: String(text) }))
            })
        });

        if (!res.ok) throw new Error(`translate request failed: ${res.status}`);

        const { results } = await res.json();

        return results && Object.keys(results).length ? results : buildFallback();

    } catch (err) {

        console.error("translateFields error:", err);
        // сеть/сервис перевода недоступны — объявление всё равно должно
        // публиковаться, просто без реального перевода (как раньше)
        return buildFallback();

    }

};

// достаёт значение поля из результата перевода с fallback на исходный
// текст, если поле было пустым/необязательным и не отправлялось на перевод
export const pickLangValue = (results, id, rawText) => {

    const r = results[id];
    const fallback = rawText || "";

    if (!r) {
        return { ru: fallback, en: fallback, uz: fallback };
    }

    return {
        ru: r.ru ?? fallback,
        en: r.en ?? fallback,
        uz: r.uz ?? fallback
    };

};
