/* Переиспользуемый компонент SEO/OG-тегов.
   React 19 умеет сам поднимать <title>/<meta>/<link>, отрендеренные
   в любом месте дерева компонентов, в <head> документа — отдельный
   пакет (react-helmet) для этого не нужен. */

const SITE_NAME = "UrbanKey";
const FALLBACK_IMAGE = "/image (16).webp";

const Seo = ({ title, description, image, noIndex = false }) => {

    const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — ключи от вашей недвижимости`;
    const desc = description || "UrbanKey — подбор и продажа недвижимости: виллы, квартиры, коммерческие объекты.";
    const ogImage = image
        ? (image.startsWith("http") ? image : `${window.location.origin}${image}`)
        : `${window.location.origin}${FALLBACK_IMAGE}`;
    const url = typeof window !== "undefined" ? window.location.href : "";

    return (
        <>
            <title>{fullTitle}</title>
            <meta name="description" content={desc} />
            {noIndex && <meta name="robots" content="noindex, nofollow" />}

            <link rel="canonical" href={url} />

            <meta property="og:type" content="website" />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={desc} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:url" content={url} />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={desc} />
            <meta name="twitter:image" content={ogImage} />
        </>
    );
};

export default Seo;
