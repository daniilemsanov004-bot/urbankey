/* Переиспользуемый компонент SEO/OG-тегов.
   React 19 умеет сам поднимать <title>/<meta>/<link>, отрендеренные
   в любом месте дерева компонентов, в <head> документа — отдельный
   пакет (react-helmet) для этого не нужен. */

import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { DEFAULT_LANG, SUPPORTED_LANGS, stripLangPrefix } from "../utils/lang";

const SITE_NAME = "UrbanKey";
const FALLBACK_IMAGE = "/image (16).webp";
const SITE_ORIGIN = "https://urbankey.uz";

const OG_LOCALES = { ru: "ru_RU", en: "en_US", uz: "uz_UZ" };

const DEFAULT_TITLE = {
    ru: "UrbanKey — ключи от вашей недвижимости в Ташкенте",
    en: "UrbanKey — real estate keys in Tashkent",
    uz: "UrbanKey — Toshkentdagi ko'chmas mulk kalitlari",
};

const DEFAULT_DESCRIPTION = {
    ru: "UrbanKey — подбор и продажа недвижимости в Ташкенте: виллы, квартиры, коммерческие объекты.",
    en: "UrbanKey — real estate selection and sales in Tashkent: villas, apartments, commercial properties.",
    uz: "UrbanKey — Toshkentda ko'chmas mulk tanlash va sotish: villalar, kvartiralar, tijorat obyektlari.",
};

/**
 * @param {string} [title] - заголовок страницы (без названия сайта, оно добавится само)
 * @param {string} [description]
 * @param {string} [image] - абсолютный или относительный (от корня) URL картинки
 * @param {boolean} [noIndex]
 * @param {object|object[]} [jsonLd] - один объект или массив объектов schema.org для JSON-LD
 */
const Seo = ({ title, description, image, noIndex = false, jsonLd }) => {
    const { i18n } = useTranslation();
    const { pathname, search } = useLocation();
    const lang = SUPPORTED_LANGS.includes(i18n.language) ? i18n.language : DEFAULT_LANG;

    const fullTitle = title ? `${title} — ${SITE_NAME}` : DEFAULT_TITLE[lang];
    const desc = description || DEFAULT_DESCRIPTION[lang];
    const ogImage = image
        ? (image.startsWith("http") ? image : `${SITE_ORIGIN}${image}`)
        : `${SITE_ORIGIN}${FALLBACK_IMAGE}`;

    // Canonical: без query-строки (фильтры каталога, utm-метки и т.п. не должны создавать дубли)
    // и всегда абсолютный, с текущим языковым префиксом.
    const canonicalUrl = `${SITE_ORIGIN}${pathname}`;

    // Путь без языкового сегмента — нужен, чтобы построить ссылки на остальные языковые версии.
    const basePath = stripLangPrefix(pathname);

    const jsonLdList = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

    return (
        <>
            <title>{fullTitle}</title>
            <meta name="description" content={desc} />
            {noIndex && <meta name="robots" content="noindex, nofollow" />}

            <link rel="canonical" href={canonicalUrl} />

            {/* hreflang: у каждой RU/EN/UZ версии страницы — собственный индексируемый URL */}
            {SUPPORTED_LANGS.map((code) => (
                <link
                    key={code}
                    rel="alternate"
                    hrefLang={code}
                    href={`${SITE_ORIGIN}/${code}${basePath}${search}`}
                />
            ))}
            <link
                rel="alternate"
                hrefLang="x-default"
                href={`${SITE_ORIGIN}/${DEFAULT_LANG}${basePath}${search}`}
            />

            <meta property="og:type" content="website" />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={desc} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:locale" content={OG_LOCALES[lang]} />
            {SUPPORTED_LANGS.filter((c) => c !== lang).map((c) => (
                <meta key={c} property="og:locale:alternate" content={OG_LOCALES[c]} />
            ))}

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={desc} />
            <meta name="twitter:image" content={ogImage} />

            {jsonLdList.map((obj, i) => (
                <script key={i} type="application/ld+json">
                    {JSON.stringify(obj)}
                </script>
            ))}
        </>
    );
};

export default Seo;
