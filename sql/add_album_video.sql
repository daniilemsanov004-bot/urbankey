-- Выполнить один раз в Supabase -> SQL Editor.
--
-- ЗАЧЕМ: у бота уже была атомарная функция append_album_image() для
-- накопления ФОТО альбома (см. add_album_gallery.sql, которая должна
-- была применяться раньше этой). Теперь бот умеет принимать из альбома
-- ещё и ВИДЕО — им нужна отдельная колонка + такая же атомарная функция
-- добавления, иначе при параллельных вызовах serverless-функции на
-- каждое видео альбома они будут перетирать друг друга так же, как
-- раньше терялись фото без append_album_image.
--
-- Идемпотентно, можно перезапускать.

ALTER TABLE bot_pending_albums
    ADD COLUMN IF NOT EXISTS videos text[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION append_album_video(p_media_group_id text, p_video text)
RETURNS void
LANGUAGE sql
AS $$
    INSERT INTO bot_pending_albums (media_group_id, videos)
    VALUES (p_media_group_id, ARRAY[p_video])
    ON CONFLICT (media_group_id)
    DO UPDATE SET videos = array_append(bot_pending_albums.videos, p_video);
$$;

-- =====================================================================
-- ПРОВЕРКА: select proname from pg_proc where proname = 'append_album_video';
-- должна вернуть одну строку. Если у bot_pending_albums.media_group_id
-- нет UNIQUE-ограничения (ON CONFLICT требует его) — сначала посмотрите,
-- как объявлена таблица в add_album_gallery.sql, и при необходимости:
--   ALTER TABLE bot_pending_albums ADD CONSTRAINT bot_pending_albums_media_group_id_key UNIQUE (media_group_id);
-- =====================================================================
