-- =====================================================================
-- UrbanKey — доступ пользователя к СВОЕЙ commercial_pages
-- =====================================================================
--
-- ЗАЧЕМ: пользователь теперь при публикации своего коммерческого
-- объявления (createUserProperty) создаёт не только строку в
-- commercials, но и в commercial_pages (галерея фото, преимущества,
-- подробное описание) — без этого страница объекта была бы почти
-- пустой. Но политика "commercial_pages_write_admin" из
-- security_hardening.sql разрешает запись только admin, поэтому
-- insert от обычного пользователя будет отклонён RLS.
--
-- Этот файл добавляет отдельные политики, разрешающие пользователю
-- создавать/менять/удалять commercial_pages ТОЛЬКО для того
-- commercial_id, который принадлежит ему самому (created_by = его id) —
-- по той же схеме, что уже используется для villas в
-- user_listings_and_leads.sql.
--
-- КАК ПРИМЕНИТЬ: Supabase Dashboard -> SQL Editor -> вставить файл
-- целиком -> Run. Идемпотентно, можно перезапускать.
-- =====================================================================

drop policy if exists "commercial_pages_insert_own" on public.commercial_pages;
drop policy if exists "commercial_pages_update_own" on public.commercial_pages;
drop policy if exists "commercial_pages_delete_own" on public.commercial_pages;

create policy "commercial_pages_insert_own"
on public.commercial_pages for insert
to authenticated
with check (
  commercial_id in (
    select id from public.commercials where created_by = auth.uid()
  )
);

create policy "commercial_pages_update_own"
on public.commercial_pages for update
to authenticated
using (
  commercial_id in (
    select id from public.commercials where created_by = auth.uid()
  )
)
with check (
  commercial_id in (
    select id from public.commercials where created_by = auth.uid()
  )
);

create policy "commercial_pages_delete_own"
on public.commercial_pages for delete
to authenticated
using (
  commercial_id in (
    select id from public.commercials where created_by = auth.uid()
  )
);

-- =====================================================================
-- ГОТОВО. Проверьте: обычный пользователь публикует коммерческое
-- объявление через /add-property -> открывает страницу этого объекта
-- в каталоге -> видит галерею фото и преимущества, а не пустую карточку.
-- =====================================================================
