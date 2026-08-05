-- Выполнить один раз в Supabase -> SQL Editor.
--
-- Галерея объекта (villas.images / commercial_pages.images) теперь может
-- содержать не только фото, но и видео с бота. Храним видео ОТДЕЛЬНО от
-- images (а не вперемешку в одном массиве), чтобы фронтенду не нужно
-- было каждый раз распознавать тип файла по расширению — типовое поле
-- надёжнее.

ALTER TABLE villas
    ADD COLUMN IF NOT EXISTS videos text[] NOT NULL DEFAULT '{}';

ALTER TABLE commercial_pages
    ADD COLUMN IF NOT EXISTS videos text[] NOT NULL DEFAULT '{}';

-- Если у вас есть публичные view поверх этих таблиц (по аналогии с
-- cardss_public/commercials_public) — добавьте videos и туда, иначе
-- сайт их не увидит.
