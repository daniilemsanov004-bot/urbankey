-- Запустить один раз в Supabase -> SQL Editor.
-- Добавляет поле "это аренда (true) или продажа (false/null)" обеим
-- таблицам — теперь ИИ/regex-парсер определяют это сами по тексту
-- поста (см. detectIsRent / is_rent в api/listingParser.js) и
-- записывают сюда.

ALTER TABLE cardss ADD COLUMN IF NOT EXISTS is_rent boolean;
ALTER TABLE commercials ADD COLUMN IF NOT EXISTS is_rent boolean;

-- ВАЖНО про view cardss_public / commercials_public (сайт читает
-- ИМЕННО их, см. src/Context.jsx) — в отличие от add_boost.sql, тут
-- НЕ даём готовый CREATE OR REPLACE VIEW: файл sql/recreate_public_views.sql
-- в репозитории — это снимок на момент его создания, у вас в Supabase
-- view мог с тех пор обрасти другими полями (amenities и т.п.),
-- которых в том файле уже нет. Слепой CREATE OR REPLACE VIEW с
-- неполным списком колонок молча УДАЛИТ из view всё, что в него не
-- попало — поэтому здесь только безопасный ALTER TABLE выше.
--
-- Чтобы добавить is_rent в view, ничего не сломав, выполните по
-- очереди для каждого из двух view:
--
--   1. Посмотрите текущее определение (скопируйте результат):
--      SELECT pg_get_viewdef('cardss_public'::regclass, true);
--      SELECT pg_get_viewdef('commercials_public'::regclass, true);
--
--   2. Возьмите скопированный текст, добавьте туда ", is_rent" в конец
--      списка колонок (перед "FROM ...") и выполните:
--      CREATE OR REPLACE VIEW cardss_public AS <вставленный текст с is_rent>;
--      CREATE OR REPLACE VIEW commercials_public AS <вставленный текст с is_rent>;
--
-- Если на сайте is_rent используется до этого шага — компонент просто
-- получит undefined и покажет то же, что показывал бы для "продажи"
-- (см. поведение в src/components/CommercialHero.jsx /
-- src/components/Property.jsx — там ветка "иначе — Продажа").
