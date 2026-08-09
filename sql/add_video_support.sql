-- Запустить один раз в Supabase -> SQL Editor.
--
-- Добавляет поле под ссылку на видео (одно видео на объект — как и с
-- главным фото карточки). Плюс нужно один раз создать Storage-бакет
-- "videos" (Supabase Dashboard -> Storage -> New bucket -> назвать
-- "videos", отметить Public bucket) — так же, как в своё время бакет
-- "images".

ALTER TABLE cardss
    ADD COLUMN IF NOT EXISTS video text;

ALTER TABLE commercials
    ADD COLUMN IF NOT EXISTS video text;

ALTER TABLE villas
    ADD COLUMN IF NOT EXISTS video text;

ALTER TABLE commercial_pages
    ADD COLUMN IF NOT EXISTS video text;

ALTER TABLE bot_pending_albums
    ADD COLUMN IF NOT EXISTS video text;
