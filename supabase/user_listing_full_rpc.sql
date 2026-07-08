-- =====================================================================
-- UrbanKey — просмотр СВОЕГО объявления целиком (для редактирования)
-- =====================================================================
--
-- ЗАЧЕМ: cardss_public/commercials_public и колоночные GRANT (см.
-- user_listings_and_leads.sql) специально НЕ отдают owner_phone/
-- owner_telegram никому, кроме admin через таблицу leads. Это защита от
-- утечки контактов через каталог. Но при открытии СВОЕГО объявления для
-- редактирования пользователю нужно увидеть и эти поля — иначе форма
-- покажет пустой номер телефона, хотя он сам его вводил при публикации.
--
-- РЕШЕНИЕ: функция с security definer, которая обходит колоночные
-- права (выполняется от имени владельца функции), но сама, ВНУТРИ,
-- жёстко проверяет "created_by = auth.uid()" — то есть чужое
-- объявление получить через неё нельзя, дыры это не открывает.
--
-- КАК ПРИМЕНИТЬ: Supabase Dashboard -> SQL Editor -> вставить целиком ->
-- Run. Идемпотентно.
-- =====================================================================

drop function if exists public.get_my_listing_full(text, bigint);

create or replace function public.get_my_listing_full(p_kind text, p_id bigint)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
    result json;
begin

    if auth.uid() is null then
        return null;
    end if;

    if p_kind = 'commercial' then

        select row_to_json(t) into result
        from (
            select
                c.*,
                cp.slug,
                cp.about_ru, cp.about_en, cp.about_uz,
                cp.location_ru, cp.location_en, cp.location_uz,
                cp.type_ru, cp.type_en, cp.type_uz,
                cp.purpose_ru, cp.purpose_en, cp.purpose_uz,
                cp.ceiling_height,
                cp.images,
                cp.amenities
            from public.commercials c
            left join public.commercial_pages cp on cp.commercial_id = c.id
            where c.id = p_id
              and c.created_by = auth.uid()
        ) t;

    else

        select row_to_json(t) into result
        from (
            select
                c.*,
                v.slug,
                v.about_ru, v.about_en, v.about_uz,
                v.location_ru, v.location_en, v.location_uz,
                v.year,
                v.square,
                v.images,
                v.amenities
            from public.cardss c
            left join public.villas v on v.card_id = c.id
            where c.id = p_id
              and c.created_by = auth.uid()
        ) t;

    end if;

    return result;

end;
$$;

grant execute on function public.get_my_listing_full(text, bigint) to authenticated;

-- =====================================================================
-- ГОТОВО. Проверка: supabase.rpc('get_my_listing_full', { p_kind: 'residential', p_id: 123 })
-- должна вернуть полный объект (включая owner_phone/owner_telegram),
-- только если объявление #123 создано текущим пользователем — иначе null.
-- =====================================================================
