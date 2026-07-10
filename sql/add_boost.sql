-- Запустить один раз в Supabase -> SQL Editor.
-- Добавляет поле "объявление в топе до какого момента" обеим таблицам.

ALTER TABLE cardss ADD COLUMN IF NOT EXISTS boosted_until timestamptz;
ALTER TABLE commercials ADD COLUMN IF NOT EXISTS boosted_until timestamptz;

-- Если у вас есть view cardss_public / commercials_public (используются
-- в коде как основной источник чтения) — добавьте туда это поле тоже,
-- иначе сайт его не увидит. Пример (подставьте реальный SQL вашего view):
--
-- CREATE OR REPLACE VIEW cardss_public AS
-- SELECT ..., boosted_until FROM cardss;
--
-- CREATE OR REPLACE VIEW commercials_public AS
-- SELECT ..., boosted_until FROM commercials;
