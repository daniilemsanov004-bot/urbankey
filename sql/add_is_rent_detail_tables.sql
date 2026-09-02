-- Запустить один раз в Supabase -> SQL Editor.
--
-- Продолжение sql/add_is_rent.sql: та миграция добавила is_rent только
-- в cardss/commercials (лёгкие таблицы для каталога/списка). Но
-- реальная СТРАНИЦА объекта (CommercialHero/CommercialAmenities,
-- Villa/Property/Amenities) читает данные из ДРУГИХ, отдельных таблиц —
-- commercial_pages и villas (через api/finalize-albums.js:createDraftPage,
-- см. draftTable/draftLinkField). В код на бэкенде is_rent для этих
-- таблиц уже вставляется (api/finalize-albums.js, api/telegram-webhook.js,
-- server/bot.js — basePayload внутри createDraftPage), а колонки не
-- было — из-за этого вставка в commercial_pages могла падать целиком
-- (Supabase обычно отклоняет весь insert при несуществующей колонке),
-- и бот в канале писал "черновик страницы объекта создать не удалось".

ALTER TABLE commercial_pages ADD COLUMN IF NOT EXISTS is_rent boolean;
ALTER TABLE villas ADD COLUMN IF NOT EXISTS is_rent boolean;

-- Эти две таблицы читаются НАПРЯМУЮ (без _public view — см.
-- src/Context.jsx: getCommercialById -> .from("commercial_pages"),
-- getVilla -> .from("villas")), поэтому здесь, в отличие от
-- cardss_public/commercials_public, никакого view чинить не нужно —
-- ALTER TABLE выше уже всё решает.
--
-- ВАЖНО: старые объявления, у которых до этой миграции вставка
-- черновика страницы падала с ошибкой (бот писал "заведите её вручную"
-- в канал) — этот ALTER их задним числом не чинит, у них просто нет
-- строки в commercial_pages/villas вообще. Их нужно либо дозавести
-- вручную в админке, либо опубликовать пост в канале заново.
