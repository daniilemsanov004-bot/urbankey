-- Пересоздаём оба view, добавляя boosted_until.
-- Остальные поля и порядок оставлены точно как было — только один
-- новый столбец в конце перед FROM.

CREATE OR REPLACE VIEW public.cardss_public AS
SELECT
    id,
    title_ru,
    title_en,
    title_uz,
    description_ru,
    description_en,
    description_uz,
    bedrooms_ru,
    bedrooms_en,
    bedrooms_uz,
    bathrooms_ru,
    bathrooms_en,
    bathrooms_uz,
    type_ru,
    type_en,
    type_uz,
    price,
    image,
    link,
    created_by,
    boosted_until
FROM cardss;


CREATE OR REPLACE VIEW public.commercials_public AS
SELECT
    id,
    title_ru,
    title_en,
    title_uz,
    description_ru,
    description_en,
    description_uz,
    district_ru,
    district_en,
    district_uz,
    address_ru,
    address_en,
    address_uz,
    class_ru,
    class_en,
    class_uz,
    landmark_ru,
    landmark_en,
    landmark_uz,
    floor,
    ceiling,
    area,
    price,
    discount_price,
    discount,
    status_ru,
    status_en,
    status_uz,
    delivery_date,
    image,
    created_by,
    boosted_until
FROM commercials;
