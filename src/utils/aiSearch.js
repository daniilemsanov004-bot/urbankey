// Вызывает /api/ai-search — разбирает свободный текст в структурные
// фильтры каталога. Никогда не бросает наверх "жёстко" при сетевой
// ошибке/недоступности ИИ — в этом случае возвращает { ok: false },
// чтобы вызывающий код (Catalog.jsx) мог тихо откатиться на обычный
// текстовый поиск, не показывая пользователю ошибку.
export const aiSearchCatalog = async (query, lang) => {

    try {

        const response = await fetch("/api/ai-search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, lang })
        });

        if (!response.ok) return { ok: false };

        return await response.json();

    } catch {
        return { ok: false };
    }

};
