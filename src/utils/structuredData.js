// Хелперы для построения JSON-LD (schema.org). Данные берутся только из реальных
// полей проекта/объекта — никаких выдуманных значений (рейтинги, отзывы и т.п. не добавляем,
// т.к. на сайте нет соответствующих данных).

const SITE_ORIGIN = "https://urbankey.uz";

/**
 * Organization + RealEstateAgent — один объект, размещается на главной странице.
 * Использует только реальные контакты компании.
 */
export const buildOrganizationJsonLd = () => ({
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${SITE_ORIGIN}/#organization`,
    name: "UrbanKey",
    url: SITE_ORIGIN,
    logo: `${SITE_ORIGIN}/favicon.png`,
    image: `${SITE_ORIGIN}/image (16).webp`,
    areaServed: {
        "@type": "City",
        name: "Tashkent",
    },
    address: {
        "@type": "PostalAddress",
        addressLocality: "Tashkent",
        addressCountry: "UZ",
    },
});

/**
 * BreadcrumbList для страниц объектов недвижимости.
 * @param {{name: string, path: string}[]} items - path относительный, без языкового префикса и origin
 * @param {string} lang
 */
export const buildBreadcrumbJsonLd = (items, lang) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: `${SITE_ORIGIN}/${lang}${item.path}`,
    })),
});

/**
 * Карточка объекта недвижимости (жилая — вилла/квартира).
 * Заполняются только реально существующие в данных объекта поля.
 */
export const buildResidenceJsonLd = ({ villa, lang, url }) => {
    const name = villa?.title?.[lang] || villa?.title?.ru;
    const description = villa?.about?.[lang] || villa?.about?.ru;

    const data = {
        "@context": "https://schema.org",
        "@type": "House",
        name,
        description,
        url,
        image: Array.isArray(villa?.images) ? villa.images : undefined,
        address: {
            "@type": "PostalAddress",
            addressLocality: "Tashkent",
            addressCountry: "UZ",
            streetAddress: villa?.address || undefined,
        },
    };

    if (villa?.price) {
        data.offers = {
            "@type": "Offer",
            price: villa.price,
            priceCurrency: villa?.currency || "USD",
            availability: "https://schema.org/InStock",
        };
    }

    if (villa?.area) {
        data.floorSize = {
            "@type": "QuantitativeValue",
            value: villa.area,
            unitCode: "MTK",
        };
    }

    if (villa?.rooms) {
        data.numberOfRooms = villa.rooms;
    }

    return data;
};

/**
 * Карточка коммерческого объекта.
 */
export const buildCommercialJsonLd = ({ page, lang, url }) => {
    const name = page?.title?.[lang] || page?.title?.ru;
    const description = page?.about?.[lang] || page?.about?.ru;

    const data = {
        "@context": "https://schema.org",
        "@type": "CommercialPropertyListing",
        name,
        description,
        url,
        image: Array.isArray(page?.images) ? page.images : undefined,
        address: {
            "@type": "PostalAddress",
            addressLocality: "Tashkent",
            addressCountry: "UZ",
            streetAddress: page?.address || undefined,
        },
    };

    if (page?.price) {
        data.offers = {
            "@type": "Offer",
            price: page.price,
            priceCurrency: page?.currency || "USD",
            availability: "https://schema.org/InStock",
        };
    }

    return data;
};
