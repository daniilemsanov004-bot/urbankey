// /api/sitemap — динамический sitemap.xml.
//
// ПОЧЕМУ ДИНАМИЧЕСКИ, А НЕ BUILD-TIME:
// UrbanKey — сайт объявлений недвижимости, где объекты добавляются,
// снимаются с продажи и удаляются гораздо чаще, чем происходят деплои.
// Sitemap, сгенерированный во время `npm run build`, был бы актуален
// только на момент последнего деплоя и быстро расходился бы с реальным
// состоянием каталога (новые объекты не попадали бы в sitemap, проданные —
// не удалялись бы из него), что для поисковиков хуже, чем сам факт
// динамической генерации. Serverless-функция всегда отдаёт данные из
// Supabase на момент запроса, а Cache-Control (см. ниже) не даёт дёргать
// базу на каждый чих поискового бота.
//
// Использует ТОЛЬКО anon-ключ (тот же, что и клиентское приложение) —
// sitemap не должен и не может показывать ничего, что недоступно
// анонимному посетителю каталога. Ни service_role, ни другие секреты
// сюда не попадают.
//
// Требуемые переменные окружения (уже настроены в проекте для фронтенда):
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_KEY

import { createClient } from "@supabase/supabase-js";

const SITE_ORIGIN = "https://urbankey.uz";
const LANGS = ["ru", "en", "uz"];
const DEFAULT_LANG = "ru";

// Публичные, индексируемые статические страницы (без языкового префикса —
// он добавляется ниже для каждого языка).
const STATIC_PATHS = [
    { path: "", priority: "1.0", changefreq: "daily" },
    { path: "/AboutUs", priority: "0.5", changefreq: "monthly" },
    { path: "/Properties", priority: "0.9", changefreq: "daily" },
    { path: "/Services", priority: "0.5", changefreq: "monthly" },
    { path: "/ContactUs", priority: "0.5", changefreq: "monthly" },
];

function getSupabase() {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

function xmlEscape(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function toIsoDate(value) {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
}

/**
 * Один <url> блок со всеми hreflang-альтернативами (по одному <url> на
 * language-версию страницы, как того требует sitemap-протокол — каждая
 * версия перечисляется отдельно, с одинаковым набором xhtml:link).
 */
function buildUrlBlock(loc, lastmod, alternates, priority, changefreq) {
    let block = `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n`;
    if (lastmod) block += `    <lastmod>${lastmod}</lastmod>\n`;
    if (changefreq) block += `    <changefreq>${changefreq}</changefreq>\n`;
    if (priority) block += `    <priority>${priority}</priority>\n`;
    for (const alt of alternates) {
        block += `    <xhtml:link rel="alternate" hreflang="${alt.lang}" href="${xmlEscape(alt.href)}" />\n`;
    }
    block += `  </url>\n`;
    return block;
}

function buildAlternates(basePath) {
    const alternates = LANGS.map((lang) => ({
        lang,
        href: `${SITE_ORIGIN}/${lang}${basePath}`,
    }));
    alternates.push({
        lang: "x-default",
        href: `${SITE_ORIGIN}/${DEFAULT_LANG}${basePath}`,
    });
    return alternates;
}

async function fetchListingIds(supabase, publicView, fallbackTable) {
    let { data, error } = await supabase.from(publicView).select("*");

    if (error) {
        // view ещё не создана / миграция не применена — тот же путь,
        // что уже используется в остальном приложении (см. Context.jsx).
        ({ data, error } = await supabase.from(fallbackTable).select("id, updated_at, created_at"));
    }

    if (error) {
        console.error(`sitemap: failed to read ${publicView}/${fallbackTable}:`, error.message);
        return [];
    }

    return Array.isArray(data) ? data : [];
}

export default async function handler(req, res) {
    const urls = [];

    for (const { path, priority, changefreq } of STATIC_PATHS) {
        const alternates = buildAlternates(path);
        for (const lang of LANGS) {
            urls.push(
                buildUrlBlock(`${SITE_ORIGIN}/${lang}${path}`, null, alternates, priority, changefreq)
            );
        }
    }

    const supabase = getSupabase();

    if (supabase) {
        try {
            const cards = await fetchListingIds(supabase, "cardss_public", "cardss");
            for (const item of cards) {
                if (!item?.id) continue;
                const basePath = `/property/${item.id}`;
                const alternates = buildAlternates(basePath);
                const lastmod = toIsoDate(item.updated_at || item.created_at);
                for (const lang of LANGS) {
                    urls.push(
                        buildUrlBlock(`${SITE_ORIGIN}/${lang}${basePath}`, lastmod, alternates, "0.8", "weekly")
                    );
                }
            }
        } catch (err) {
            console.error("sitemap: properties block failed", err);
        }

        try {
            const commercials = await fetchListingIds(supabase, "commercials_public", "commercials");
            for (const item of commercials) {
                if (!item?.id) continue;
                const basePath = `/commercial/${item.id}`;
                const alternates = buildAlternates(basePath);
                const lastmod = toIsoDate(item.updated_at || item.created_at);
                for (const lang of LANGS) {
                    urls.push(
                        buildUrlBlock(`${SITE_ORIGIN}/${lang}${basePath}`, lastmod, alternates, "0.8", "weekly")
                    );
                }
            }
        } catch (err) {
            console.error("sitemap: commercial block failed", err);
        }
    } else {
        console.error("sitemap: Supabase env vars not configured, serving static pages only");
    }

    const xml =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
        urls.join("") +
        `</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    // Кэш на edge на 1 час, отдача устаревшей копии ещё сутки, пока фоново
    // не обновится — sitemap не должен грузить базу на каждый заход бота,
    // но и не должен быть более чем на ~час устаревшим.
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).send(xml);
}
