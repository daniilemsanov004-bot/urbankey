-- =====================================================================
-- UrbanKey — полное закрытие таблиц политиками Row Level Security (RLS)
-- =====================================================================
--
-- ЗАЧЕМ ЭТО НУЖНО:
-- Фронтенд использует "publishable"/anon-ключ Supabase, который открыт
-- и виден любому в браузере (это нормально и ожидаемо для Supabase).
-- Единственное, что реально защищает данные от чтения/изменения/удаления
-- посторонними людьми — это RLS-политики на самих таблицах в базе.
-- Кнопки "только для admin" в интерфейсе — это лишь удобство, они НЕ
-- защита: любой человек может открыть консоль браузера и напрямую
-- вызвать supabase.from("cardss").delete()... в обход интерфейса.
-- Без политик ниже (или при неверно настроенных) это реально сработает.
--
-- КАК ПРИМЕНИТЬ:
-- 1. Supabase Dashboard -> ваш проект -> SQL Editor -> New query.
-- 2. Вставьте содержимое этого файла целиком и нажмите Run.
-- 3. Проверьте Dashboard -> Authentication -> Policies — по каждой
--    таблице должны появиться политики ниже.
-- 4. Если у каких-то таблиц уже были свои политики — сначала посмотрите
--    их (Dashboard -> Table editor -> RLS), чтобы не задвоить/не
--    законфликтовать. Скрипт использует "drop policy if exists", так что
--    повторный запуск безопасен.
--
-- ВАЖНО: это НЕ содержит service_role — Edge Function delete-account
-- и Telegram-бот используют service_role ключ отдельно и RLS для них
-- не действует (service_role всегда обходит RLS — так и должно быть).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. Вспомогательная функция: является ли текущий пользователь админом
-- ---------------------------------------------------------------------
-- SECURITY DEFINER + фиксированный search_path, чтобы функцию нельзя
-- было подменить/обойти через подсовывание своей схемы
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;


-- ---------------------------------------------------------------------
-- 1. profiles — профили пользователей
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "profiles_no_client_insert" on public.profiles;
drop policy if exists "profiles_no_client_delete" on public.profiles;

-- читать профили может любой (нужно для отображения имени автора отзыва,
-- поиска пользователей в админке и т.п.)
create policy "profiles_select_all"
on public.profiles for select
to anon, authenticated
using (true);

-- обновлять СВОЙ профиль может только сам пользователь,
-- и он НЕ может менять себе роль (role) — это критично, иначе
-- любой пользователь через консоль браузера мог бы назначить
-- себя админом: supabase.from('profiles').update({role:'admin'})
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role = (select role from public.profiles where id = auth.uid())
);

-- менять чужую роль (назначать/снимать админа) может только admin
create policy "profiles_update_admin"
on public.profiles for update
to authenticated
using (public.is_admin())
with check (true);

-- вставка профиля обычно должна происходить только через триггер
-- при регистрации (auth.users -> profiles), а не напрямую с клиента
create policy "profiles_no_client_insert"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

-- удалять профиль может только Edge Function delete-account
-- (она работает через service_role и RLS не проверяет) — с клиента нельзя
create policy "profiles_no_client_delete"
on public.profiles for delete
to authenticated
using (false);


-- ---------------------------------------------------------------------
-- 2. cardss — карточки жилой недвижимости
-- ---------------------------------------------------------------------
alter table public.cardss enable row level security;

drop policy if exists "cardss_select_all" on public.cardss;
drop policy if exists "cardss_write_admin" on public.cardss;

-- каталог публичный — читать может кто угодно, без авторизации
create policy "cardss_select_all"
on public.cardss for select
to anon, authenticated
using (true);

-- создавать/менять/удалять карточки может только admin
create policy "cardss_write_admin"
on public.cardss for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ---------------------------------------------------------------------
-- 3. commercials — карточки коммерческой недвижимости
-- ---------------------------------------------------------------------
alter table public.commercials enable row level security;

drop policy if exists "commercials_select_all" on public.commercials;
drop policy if exists "commercials_write_admin" on public.commercials;

create policy "commercials_select_all"
on public.commercials for select
to anon, authenticated
using (true);

create policy "commercials_write_admin"
on public.commercials for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ---------------------------------------------------------------------
-- 4. commercial_pages — расширенные страницы коммерции
-- ---------------------------------------------------------------------
alter table public.commercial_pages enable row level security;

drop policy if exists "commercial_pages_select_all" on public.commercial_pages;
drop policy if exists "commercial_pages_write_admin" on public.commercial_pages;

create policy "commercial_pages_select_all"
on public.commercial_pages for select
to anon, authenticated
using (true);

create policy "commercial_pages_write_admin"
on public.commercial_pages for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ---------------------------------------------------------------------
-- 5. villas
-- ---------------------------------------------------------------------
alter table public.villas enable row level security;

drop policy if exists "villas_select_all" on public.villas;
drop policy if exists "villas_write_admin" on public.villas;

create policy "villas_select_all"
on public.villas for select
to anon, authenticated
using (true);

create policy "villas_write_admin"
on public.villas for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ---------------------------------------------------------------------
-- 6. favorites — избранное пользователя
-- ---------------------------------------------------------------------
alter table public.favorites enable row level security;

drop policy if exists "favorites_select_own" on public.favorites;
drop policy if exists "favorites_insert_own" on public.favorites;
drop policy if exists "favorites_delete_own" on public.favorites;

-- видеть можно только своё избранное
create policy "favorites_select_own"
on public.favorites for select
to authenticated
using (auth.uid() = user_id);

-- добавлять можно только от своего имени
create policy "favorites_insert_own"
on public.favorites for insert
to authenticated
with check (auth.uid() = user_id);

-- удалять можно только своё
create policy "favorites_delete_own"
on public.favorites for delete
to authenticated
using (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- 7. reviews — отзывы
-- ---------------------------------------------------------------------
alter table public.reviews enable row level security;

drop policy if exists "reviews_select_all" on public.reviews;
drop policy if exists "reviews_insert_own" on public.reviews;
drop policy if exists "reviews_update_own_or_admin" on public.reviews;
drop policy if exists "reviews_delete_own_or_admin" on public.reviews;

-- отзывы публичные — читает кто угодно
create policy "reviews_select_all"
on public.reviews for select
to anon, authenticated
using (true);

-- создавать отзыв можно только от своего имени
create policy "reviews_insert_own"
on public.reviews for insert
to authenticated
with check (auth.uid() = user_id);

-- редактировать — только свой отзыв (админ тоже не может лезть в чужой
-- текст, только удалять модерацией — см. ниже)
create policy "reviews_update_own_or_admin"
on public.reviews for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- удалять — свой отзыв ИЛИ админ (модерация)
create policy "reviews_delete_own_or_admin"
on public.reviews for delete
to authenticated
using (auth.uid() = user_id or public.is_admin());


-- =====================================================================
-- 8. Storage bucket "images" — загрузка картинок
-- =====================================================================
-- Публичное чтение (картинки должны открываться на сайте всем),
-- но загружать/удалять файлы может только авторизованный админ.
-- Если бакет уже public — select-политика ниже не помешает.

drop policy if exists "images_public_read" on storage.objects;
drop policy if exists "images_admin_write" on storage.objects;
drop policy if exists "images_admin_delete" on storage.objects;

create policy "images_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'images');

create policy "images_admin_write"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'images'
  and public.is_admin()
);

create policy "images_admin_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'images'
  and public.is_admin()
);


-- =====================================================================
-- ГОТОВО. После применения обязательно проверьте руками:
--  1. Разлогиньтесь и откройте /Properties — каталог должен грузиться
--     (публичное чтение работает).
--  2. Залогиньтесь обычным пользователем (не admin) — попробуйте в
--     консоли браузера выполнить:
--       await supabase.from('cardss').delete().eq('id', 1)
--     Должна вернуться ошибка/0 удалённых строк, а не успех.
--  3. Залогиньтесь как admin — убедитесь, что создание/редактирование/
--     удаление карточек и коммерции по-прежнему работает.
-- =====================================================================
