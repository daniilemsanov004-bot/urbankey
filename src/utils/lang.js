// Общие константы и хелперы для языковой маршрутизации (/ru /en /uz).
// Используется в App.jsx, LanguageLayout, Seo.jsx и во всех переключателях языка.

export const SUPPORTED_LANGS = ["ru", "en", "uz"];
export const DEFAULT_LANG = "ru";

/**
 * Возвращает true, если сегмент пути — поддерживаемый язык.
 */
export const isSupportedLang = (value) => SUPPORTED_LANGS.includes(value);

/**
 * Подставляет/заменяет языковой префикс в pathname.
 * "/property/slug-1" + "en"      -> "/en/property/slug-1"
 * "/ru/property/slug-1" + "en"   -> "/en/property/slug-1"
 * "/admin" + "en"                -> "/admin" (нелокализуемые разделы не трогаем)
 */
export const buildLangPath = (pathname, lang) => {
    const parts = pathname.split("/").filter(Boolean);

    if (parts.length > 0 && isSupportedLang(parts[0])) {
        parts[0] = lang;
        return "/" + parts.join("/");
    }

    // Путь не локализован (например служебный /admin, /login и т.п.) — не трогаем язык в URL,
    // просто переключаем язык интерфейса.
    return pathname;
};

/**
 * Строит ссылку на локализованную (публичную, индексируемую) страницу с текущим языком.
 * localizedPath("/Properties", "en") -> "/en/Properties"
 * localizedPath("/", "ru")           -> "/ru"
 * localizedPath("/property/slug-1", "uz") -> "/uz/property/slug-1"
 */
export const localizedPath = (path, lang) => {
    const safeLang = isSupportedLang(lang) ? lang : DEFAULT_LANG;
    const clean = path.startsWith("/") ? path : `/${path}`;
    return `/${safeLang}${clean === "/" ? "" : clean}`;
};

/**
 * Убирает языковой префикс из pathname, если он есть.
 * "/en/property/slug-1" -> "/property/slug-1"
 */
export const stripLangPrefix = (pathname) => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length > 0 && isSupportedLang(parts[0])) {
        const rest = parts.slice(1).join("/");
        return rest ? "/" + rest : "";
    }
    return pathname;
};
