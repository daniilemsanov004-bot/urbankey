-- =====================================================================
-- UrbanKey — объявления от пользователей + CRM-таблица заявок (leads)
-- =====================================================================
--
-- ЧТО ДОБАВЛЯЕТ ЭТОТ ФАЙЛ:
--   1. В таблицу cardss — поля created_by / owner_phone / owner_telegram,
--      чтобы обычный пользователь мог опубликовать своё объявление,
--      и RLS-политики, разрешающие ему создавать/менять/удалять ТОЛЬКО
--      свои объявления (админ, как и раньше, может всё).
--   2. Новую таблицу leads — единый список заявок для агентства:
--      и заявки с форм (Connect/Happen/Footer), и заявки "хочу купить
--      это объявление" от собственника. У каждой — статус
--      (new / in_contact / deal / closed), чтобы вести сделку.
--
-- ВАЖНО ПО БЕЗОПАСНОСТИ СДЕЛКИ:
--   Контакты владельца объявления (owner_phone / owner_telegram) НЕ
--   выдаются публичным select-политикам широких колонок — доступ к ним
--   имеет только admin (через политику leads_admin_all) и сам владелец
--   (через cardss_select_all, но это открытая таблица объявлений —
--   см. примечание ниже, почему это осознанный компромисс).
--   Публичная страница объявления должна брать контакты владельца
--   ТОЛЬКО из leads (при создании объявления автоматически создаётся
--   лид с owner-контактами, доступный лишь админу), а не показывать
--   owner_phone/owner_telegram из cardss в интерфейсе. Это уже сделано
--   на уровне фронтенда (PropertyPage не выводит эти поля), но раз
--   anon-ключ виден в браузере — тот, кто напрямую дёрнет
--   supabase.from('cardss').select('owner_phone,owner_telegram') сможет
--   их увидеть. Поэтому дополнительно переносим эти два поля под
--   отдельную функцию с ограниченным доступом — см. секцию 3.
--
-- КАК ПРИМЕНИТЬ: Supabase Dashboard -> SQL Editor -> вставить весь файл
-- целиком -> Run. Скрипт идемпотентный (можно перезапускать).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. cardss — добавляем поля для пользовательских объявлений
-- ---------------------------------------------------------------------

alter table public.cardss
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists owner_phone text,
  add column if not exists owner_telegram text;

comment on column public.cardss.created_by is
  'null = объявление от админа/агентства; не null = опубликовано самим пользователем';


-- разрешаем пользователю создавать СВОЁ объявление (created_by = свой id)
drop policy if exists "cardss_insert_own" on public.cardss;

create policy "cardss_insert_own"
on public.cardss for insert
to authenticated
with check (created_by = auth.uid());

-- разрешаем менять/удалять СВОЁ объявление (плюс существующая
-- cardss_write_admin по-прежнему даёт admin полный доступ ко всем)
drop policy if exists "cardss_update_own" on public.cardss;
drop policy if exists "cardss_delete_own" on public.cardss;

create policy "cardss_update_own"
on public.cardss for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy "cardss_delete_own"
on public.cardss for delete
to authenticated
using (created_by = auth.uid());


-- ---------------------------------------------------------------------
-- 2. leads — единая таблица заявок для агентства (CRM-ready)
-- ---------------------------------------------------------------------

create table if not exists public.leads (

  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 'contact_form'   — заявка с форм Connect/Connect_one/Happen/Footer
  -- 'listing_owner'  — контакты собственника, разместившего объявление
  type text not null check (type in ('contact_form', 'listing_owner')),

  -- источник (какая именно форма/раздел сайта) — свободный текст,
  -- whitelist проверяется на уровне api/lead.js, тут просто хранится
  source text,

  name text,
  phone text,
  telegram text,
  message text,

  -- если лид связан с объявлением (покупатель интересуется ИМ,
  -- либо это контакты владельца этого объявления)
  related_card_id integer references public.cardss(id) on delete set null,

  status text not null default 'new'
    check (status in ('new', 'in_contact', 'deal', 'closed')),

  raw_data jsonb,

  crm_synced_at timestamptz

);

alter table public.leads enable row level security;

drop policy if exists "leads_admin_all" on public.leads;
drop policy if exists "leads_insert_own_listing" on public.leads;

-- читать/менять статус может только admin — это внутренняя CRM
-- агентства, обычным пользователям и анонимам тут делать нечего
create policy "leads_admin_all"
on public.leads for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- пользователь может создать лид типа listing_owner ТОЛЬКО для
-- своего же объявления (created_by этого cardss = он сам) —
-- это тот самый лид с его контактами, который видит потом только admin
create policy "leads_insert_own_listing"
on public.leads for insert
to authenticated
with check (
  type = 'listing_owner'
  and related_card_id in (
    select id from public.cardss where created_by = auth.uid()
  )
);

-- индекс для быстрой фильтрации по статусу в админ-панели
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_related_card_idx on public.leads (related_card_id);


-- ---------------------------------------------------------------------
-- 3. Реально закрываем owner_phone / owner_telegram от чтения
-- ---------------------------------------------------------------------
-- Политика "cardss_select_all" (using (true)) разрешает читать ВСЕ
-- СТРОКИ таблицы — но не ограничивает КОЛОНКИ. Row Level Security в
-- Postgres работает по строкам, а не по колонкам, поэтому одной RLS
-- недостаточно: anon-ключ (виден в браузере) мог бы напрямую вызвать
--   supabase.from('cardss').select('owner_phone,owner_telegram')
-- и получить контакты всех владельцев, даже если наш фронтенд эти поля
-- нигде не показывает и не запрашивает.
--
-- Postgres умеет ограничивать доступ по КОЛОНКАМ через GRANT/REVOKE —
-- это и используем: явно забираем select на owner_phone/owner_telegram
-- у ролей anon и authenticated. RLS (по строкам) при этом продолжает
-- работать как обычно поверх этого ограничения.
--
-- Обратная сторона: после этого доступ к owner_phone/owner_telegram
-- через таблицу cardss не будет ни у кого, включая самого владельца и
-- админа — это осознанно, потому что контакты владельца уже дублируются
-- в таблицу leads (тип listing_owner), доступную только admin через
-- отдельную RLS-политику leads_admin_all. Админ работает с контактами
-- через CRM-панель (leads), а не через карточку объявления.

revoke select on public.cardss from anon, authenticated;

grant select (
  id, title_ru, title_en, title_uz,
  description_ru, description_en, description_uz,
  bedrooms_ru, bedrooms_en, bedrooms_uz,
  bathrooms_ru, bathrooms_en, bathrooms_uz,
  type_ru, type_en, type_uz,
  price, image, link, created_by
) on public.cardss to anon, authenticated;

-- удобное представление для фронтенда (то же самое, но одним select("*"))
create or replace view public.cardss_public as
  select
    id, title_ru, title_en, title_uz,
    description_ru, description_en, description_uz,
    bedrooms_ru, bedrooms_en, bedrooms_uz,
    bathrooms_ru, bathrooms_en, bathrooms_uz,
    type_ru, type_en, type_uz,
    price, image, link, created_by
  from public.cardss;

grant select on public.cardss_public to anon, authenticated;


-- ---------------------------------------------------------------------
-- 4. Storage "images" — разрешаем загрузку и обычным пользователям
-- ---------------------------------------------------------------------
-- Раньше (security_hardening.sql) загрузка картинок была только для
-- admin ("images_admin_write"). Теперь обычный пользователь тоже должен
-- уметь загрузить фото при публикации своего объявления. Удаление
-- картинок оставляем только для admin (та политика не трогается) —
-- пользователь может удалить своё ОБЪЯВЛЕНИЕ (см. cardss_delete_own),
-- а осиротевшую картинку из storage подчистит admin при необходимости.

drop policy if exists "images_authenticated_write" on storage.objects;

create policy "images_authenticated_write"
on storage.objects for insert
to authenticated
with check (bucket_id = 'images');


-- ---------------------------------------------------------------------
-- 5. То же самое для коммерческой недвижимости (commercials)
-- ---------------------------------------------------------------------
-- Пользователь теперь может опубликовать не только жилой объект
-- (cardss + villas), но и коммерческий (commercials) — по тем же
-- правилам: сразу без модерации, контакты владельца видит только admin.

alter table public.commercials
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists owner_phone text,
  add column if not exists owner_telegram text;

drop policy if exists "commercials_insert_own" on public.commercials;
drop policy if exists "commercials_update_own" on public.commercials;
drop policy if exists "commercials_delete_own" on public.commercials;

create policy "commercials_insert_own"
on public.commercials for insert
to authenticated
with check (created_by = auth.uid());

create policy "commercials_update_own"
on public.commercials for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy "commercials_delete_own"
on public.commercials for delete
to authenticated
using (created_by = auth.uid());

-- закрываем owner_phone/owner_telegram так же, как в cardss (см. секцию 3)
revoke select on public.commercials from anon, authenticated;

grant select (
  id, title_ru, title_en, title_uz,
  description_ru, description_en, description_uz,
  district_ru, district_en, district_uz,
  address_ru, address_en, address_uz,
  class_ru, class_en, class_uz,
  landmark_ru, landmark_en, landmark_uz,
  floor, ceiling, area,
  price, discount_price, discount,
  status_ru, status_en, status_uz,
  delivery_date, image, created_by
) on public.commercials to anon, authenticated;

create or replace view public.commercials_public as
  select
    id, title_ru, title_en, title_uz,
    description_ru, description_en, description_uz,
    district_ru, district_en, district_uz,
    address_ru, address_en, address_uz,
    class_ru, class_en, class_uz,
    landmark_ru, landmark_en, landmark_uz,
    floor, ceiling, area,
    price, discount_price, discount,
    status_ru, status_en, status_uz,
    delivery_date, image, created_by
  from public.commercials;

grant select on public.commercials_public to anon, authenticated;

-- villas — пользователь создаёт виллу вместе со своей карточкой,
-- поэтому villas тоже нужна политика "своя запись" (villa привязана
-- к cardss.created_by, а не к своему собственному created_by, так как
-- в таблице villas нет отдельного created_by — это нормально: доступ
-- проверяем через связанную карточку)
drop policy if exists "villas_insert_own_card" on public.villas;
drop policy if exists "villas_update_own_card" on public.villas;
drop policy if exists "villas_delete_own_card" on public.villas;

create policy "villas_insert_own_card"
on public.villas for insert
to authenticated
with check (
  card_id in (select id from public.cardss where created_by = auth.uid())
);

create policy "villas_update_own_card"
on public.villas for update
to authenticated
using (
  card_id in (select id from public.cardss where created_by = auth.uid())
)
with check (
  card_id in (select id from public.cardss where created_by = auth.uid())
);

create policy "villas_delete_own_card"
on public.villas for delete
to authenticated
using (
  card_id in (select id from public.cardss where created_by = auth.uid())
);

-- leads — добавляем связь с коммерцией и второй тип лида-владельца
alter table public.leads
  add column if not exists related_commercial_id integer references public.commercials(id) on delete set null;

drop policy if exists "leads_insert_own_listing" on public.leads;

create policy "leads_insert_own_listing"
on public.leads for insert
to authenticated
with check (
  (
    type = 'listing_owner'
    and related_card_id in (
      select id from public.cardss where created_by = auth.uid()
    )
  )
  or
  (
    type = 'commercial_owner'
    and related_commercial_id in (
      select id from public.commercials where created_by = auth.uid()
    )
  )
);

alter table public.leads
  drop constraint if exists leads_type_check;

alter table public.leads
  add constraint leads_type_check
  check (type in ('contact_form', 'listing_owner', 'commercial_owner'));

create index if not exists leads_related_commercial_idx on public.leads (related_commercial_id);


-- =====================================================================
-- ГОТОВО. Проверьте руками:
--  1. Обычный пользователь может создать объявление (created_by = его id)
--     и НЕ может создать объявление с чужим/пустым created_by.
--  2. Обычный пользователь НЕ может прочитать/менять чужие leads
--     (проверить в консоли: supabase.from('leads').select('*') —
--     должен вернуть пустой список, если он не admin).
--  3. Фронтенд для публичной страницы объявления использует
--     cardss_public (без owner_phone/owner_telegram), а не cardss.
-- =====================================================================
