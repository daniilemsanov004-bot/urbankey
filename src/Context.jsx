import { supabase } from "./supabase";
import { createContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

export const MyContext = createContext();

// Публичные "safe" наборы колонок cardss/commercials (без owner_phone/
// owner_telegram) — те же самые, что перечислены в
// supabase/user_listings_and_leads.sql в GRANT SELECT (...) и в
// определениях view cardss_public / commercials_public.
// Используются как запасной вариант, если по какой-то причине сама
// view ещё не создана в базе (миграция user_listings_and_leads.sql не
// применена) — тогда идём напрямую в таблицу, но всё равно запрашиваем
// только этот безопасный список колонок, а не "*", чтобы не упереться
// в column-level REVOKE (если он уже применён) и не потянуть по ошибке
// owner_phone/owner_telegram.
const CARD_PUBLIC_COLUMNS =
    "id, title_ru, title_en, title_uz, description_ru, description_en, description_uz, " +
    "bedrooms_ru, bedrooms_en, bedrooms_uz, bathrooms_ru, bathrooms_en, bathrooms_uz, " +
    "type_ru, type_en, type_uz, price, image, link, created_by, boosted_until";

const COMMERCIAL_PUBLIC_COLUMNS =
    "id, title_ru, title_en, title_uz, description_ru, description_en, description_uz, " +
    "district_ru, district_en, district_uz, address_ru, address_en, address_uz, " +
    "class_ru, class_en, class_uz, landmark_ru, landmark_en, landmark_uz, " +
    "floor, ceiling, area, price, discount_price, discount, " +
    "status_ru, status_en, status_uz, delivery_date, image, created_by, boosted_until";

// true, если ошибка supabase означает "такой таблицы/view не существует"
// (PostgREST/Postgres 42P01) — то есть SQL-миграция ещё не накатана
const isMissingRelation = (error) =>
    !!error && (
        error.code === "42P01" ||
        /relation .* does not exist/i.test(error.message || "") ||
        /Could not find the table/i.test(error.message || "")
    );


export const MyProvider = ({ children }) => {

    const { t } = useTranslation();

    const [commercialPages, setCommercialPages] = useState([]);
    const profileLoading = useRef(false);


    const [commercialPage, setCommercialPage] = useState(null);
    const [isBurger, setIsBurger] = useState(false);

    const [properties, setCards] = useState([]);

    const [cardId, setCardId] = useState(null);

    const [villa, setVilla] = useState(null);


    const [commercials, setCommercials] = useState([]);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const authProfileRequest = useRef(0);

    const [favorites, setFavorites] = useState([]);
    const [favoritesLoading, setFavoritesLoading] = useState(false);


    const handleBurger = () =>
        setIsBurger(prev => !prev);









    const logout = async () => {


        const { error } = await supabase.auth.signOut();


        if (error) {
            console.error("LOGOUT ERROR:", error);
            return false;
        }


        setUser(null);

        setProfile(null);


        toast.success(
            t("logoutSuccess")
        );


        return true;

    };


    const [isDark, setIsDark] = useState(() => {

        return localStorage.getItem("theme") === "light";

    });


    useEffect(() => {


        localStorage.setItem(
            "theme",
            isDark ? "light" : "dark"
        );


    }, [isDark]);


    const handleDark = () =>
        setIsDark(prev => !prev);


    const getCards = async () => {


        try {


            let { data, error } = await supabase
                .from("cardss_public")
                .select("*");


            // view cardss_public ещё не создана (миграция не применена) —
            // читаем напрямую из cardss, тем же безопасным списком колонок
            if (error && isMissingRelation(error)) {

                ({ data, error } = await supabase
                    .from("cardss")
                    .select(CARD_PUBLIC_COLUMNS));

            }


            if (error) throw error;


            const formattedData = data.map(item => ({


                id: item.id,


                title: {

                    ru: item.title_ru,
                    en: item.title_en,
                    uz: item.title_uz

                },


                description: {

                    ru: item.description_ru,
                    en: item.description_en,
                    uz: item.description_uz

                },


                bedrooms: {

                    ru: item.bedrooms_ru,
                    en: item.bedrooms_en,
                    uz: item.bedrooms_uz

                },


                bathrooms: {

                    ru: item.bathrooms_ru,
                    en: item.bathrooms_en,
                    uz: item.bathrooms_uz

                },


                type: {

                    ru: item.type_ru,
                    en: item.type_en,
                    uz: item.type_uz

                },


                image: item.image,

                price: item.price,

                link: item.link,

                boostedUntil: item.boosted_until


            }));


            setCards(formattedData);


        } catch (error) {


            console.error(error);

            toast.error(
                t("cardsLoadError")
            );


        }


    };


    const getLatestCards = async () => {


        try {


            let { data, error } = await supabase
                .from("cardss_public")
                .select("*")
                .order("id", { ascending: false })
                .limit(7);


            if (error && isMissingRelation(error)) {

                ({ data, error } = await supabase
                    .from("cardss")
                    .select(CARD_PUBLIC_COLUMNS)
                    .order("id", { ascending: false })
                    .limit(7));

            }


            if (error) throw error;


            const formattedData = data.map(item => ({


                id: item.id,


                title: {
                    ru: item.title_ru,
                    en: item.title_en,
                    uz: item.title_uz
                },


                description: {
                    ru: item.description_ru,
                    en: item.description_en,
                    uz: item.description_uz
                },


                bedrooms: {
                    ru: item.bedrooms_ru,
                    en: item.bedrooms_en,
                    uz: item.bedrooms_uz
                },


                bathrooms: {
                    ru: item.bathrooms_ru,
                    en: item.bathrooms_en,
                    uz: item.bathrooms_uz
                },


                type: {
                    ru: item.type_ru,
                    en: item.type_en,
                    uz: item.type_uz
                },


                image: item.image,

                price: item.price,

                link: item.link,

                boostedUntil: item.boosted_until


            }));


            setCards(formattedData);


        } catch (err) {


            console.error(err);

            toast.error(
                t("cardsLoadError")
            );

        }


    };
    const getLatestCommercials = async () => {

        let { data, error } = await supabase
            .from("commercials_public")
            .select("*")
            .order("id", {
                ascending: false
            })
            .limit(7);


        if (error && isMissingRelation(error)) {

            ({ data, error } = await supabase
                .from("commercials")
                .select(COMMERCIAL_PUBLIC_COLUMNS)
                .order("id", { ascending: false })
                .limit(7));

        }


        if (error) {
            console.error(error);
            return;
        }


        setCommercials(data);

    };
    const getCommercials = async () => {

        try {

            let { data, error } = await supabase
                .from("commercials_public")
                .select("*")
                .order("id", {
                    ascending: false
                });


            if (error && isMissingRelation(error)) {

                ({ data, error } = await supabase
                    .from("commercials")
                    .select(COMMERCIAL_PUBLIC_COLUMNS)
                    .order("id", { ascending: false }));

            }


            if (error) throw error;


            setCommercials(

                data.map(item => ({

                    id: item.id,


                    title: {
                        ru: item.title_ru,
                        en: item.title_en,
                        uz: item.title_uz
                    },


                    description: {
                        ru: item.description_ru,
                        en: item.description_en,
                        uz: item.description_uz
                    },


                    district: {
                        ru: item.district_ru,
                        en: item.district_en,
                        uz: item.district_uz
                    },


                    address: {
                        ru: item.address_ru,
                        en: item.address_en,
                        uz: item.address_uz
                    },


                    class: {
                        ru: item.class_ru,
                        en: item.class_en,
                        uz: item.class_uz
                    },


                    landmark: {
                        ru: item.landmark_ru,
                        en: item.landmark_en,
                        uz: item.landmark_uz
                    },


                    status: {
                        ru: item.status_ru,
                        en: item.status_en,
                        uz: item.status_uz
                    },


                    floor: item.floor,

                    ceiling_height: item.ceiling,

                    area: item.area,


                    price: item.price,

                    discount_price: item.discount_price,


                    delivery_date: item.delivery_date,


                    image: item.image,

                    boostedUntil: item.boosted_until

                }))

            );


        } catch (err) {

            console.error(err);

            toast.error(
                t("commercialsLoadError")
            );

        }

    };


    const deleteCommercial = async (id) => {

        const { error, count } = await supabase
            .from("commercials")
            .delete({ count: "exact" })
            .eq("id", id);


        if (error) {
            toast.error(error.message || t("cardDeleteError"));
            return false;
        }

        if (count === 0) {
            toast.error(
                t("cardDeleteForbidden")
            );
            return false;
        }


        await getCommercials();

        toast.success(t("cardDeleted"));

        return true;
    };


    const getCardId = async (id) => {


        let { data, error } = await supabase
            .from("cardss_public")
            .select("*")
            .eq("id", id)
            .single();


        if (error && isMissingRelation(error)) {

            ({ data, error } = await supabase
                .from("cardss")
                .select(CARD_PUBLIC_COLUMNS)
                .eq("id", id)
                .single());

        }


        if (error) {

            toast.error(
                t("cardNotFound")
            );

            return;

        }


        setCardId({


            id: data.id,


            title: {

                ru: data.title_ru,
                en: data.title_en,
                uz: data.title_uz

            },


            description: {

                ru: data.description_ru,
                en: data.description_en,
                uz: data.description_uz

            },


            price: data.price,


            image: data.image


        });


    };


    const updateCommercial = async (data, id) => {

        const { error } = await supabase
            .from("commercials")
            .update({

                title_ru: data.title.ru,
                title_en: data.title.en,
                title_uz: data.title.uz,

                description_ru: data.description.ru,
                description_en: data.description.en,
                description_uz: data.description.uz,

                district_ru: data.district.ru,
                district_en: data.district.en,
                district_uz: data.district.uz,

                address_ru: data.address.ru,
                address_en: data.address.en,
                address_uz: data.address.uz,

                class_ru: data.class.ru,
                class_en: data.class.en,
                class_uz: data.class.uz,

                landmark_ru: data.landmark.ru,
                landmark_en: data.landmark.en,
                landmark_uz: data.landmark.uz,

                status_ru: data.status.ru,
                status_en: data.status.en,
                status_uz: data.status.uz,


                floor: data.floor,
                ceiling: data.ceiling,
                area: data.area,


                price: data.price,
                discount_price: data.discount_price,
                discount: data.discount,

                delivery_date: data.delivery_date,

                image: data.image

            })
            .eq("id", id);


        if (error) {
            toast.error(error.message);
            return;
        }


        getCommercials();

        toast.success("Коммерция изменена");

    };


    const createCard = async (data) => {


        const { error } = await supabase
            .from("cardss")
            .insert([{


                title_ru: data.title.ru,
                title_en: data.title.en,
                title_uz: data.title.uz,


                description_ru: data.description.ru,
                description_en: data.description.en,
                description_uz: data.description.uz,


                bedrooms_ru: data.bedrooms.ru,
                bedrooms_en: data.bedrooms.en,
                bedrooms_uz: data.bedrooms.uz,


                price: data.price,

                image: data.image


            }]);


        if (error) {

            toast.error(error.message);

            return;

        }


        getCards();


        toast.success(
            "Создано"
        );


    };
    const createCommercial = async (data) => {

        try {


            const { error } = await supabase
                .from("commercials")
                .insert([{


                    title_ru: data.title.ru,
                    title_en: data.title.en,
                    title_uz: data.title.uz,


                    description_ru: data.description.ru,
                    description_en: data.description.en,
                    description_uz: data.description.uz,


                    district_ru: data.district.ru,
                    district_en: data.district.en,
                    district_uz: data.district.uz,


                    address_ru: data.address.ru,
                    address_en: data.address.en,
                    address_uz: data.address.uz,


                    class_ru: data.class.ru,
                    class_en: data.class.en,
                    class_uz: data.class.uz,


                    landmark_ru: data.landmark.ru,
                    landmark_en: data.landmark.en,
                    landmark_uz: data.landmark.uz,


                    floor: data.floor,
                    ceiling: data.ceiling,
                    area: data.area,


                    price: data.price,
                    discount_price: data.discount_price,
                    discount: data.discount,


                    status_ru: data.status.ru,
                    status_en: data.status.en,
                    status_uz: data.status.uz,


                    delivery_date: data.delivery_date,


                    image: data.image


                }]);


            if (error) {
                toast.error(error.message);
                return;
            }


            getCommercials();


            toast.success(
                "Коммерция создана"
            );


        } catch (err) {

            console.error(err);

        }

    };
    const getCommercialPage = async (id) => {

        setCommercialPage(null);

        const { data, error } = await supabase
            .from("commercial_pages")
            .select("*")
            .eq("id", id)
            .single();


        if (error) {
            console.error(error);
            return;
        }


        setCommercialPage({

            id: data.id,

            commercial_id: data.commercial_id,
            title: {
                ru: data.title_ru || "",
                en: data.title_en || "",
                uz: data.title_uz || ""
            },


            description: {
                ru: data.description_ru || "",
                en: data.description_en || "",
                uz: data.description_uz || ""
            },


            type: {
                ru: data.type_ru || "",
                en: data.type_en || "",
                uz: data.type_uz || ""
            },


            location: {
                ru: data.location_ru || "",
                en: data.location_en || "",
                uz: data.location_uz || ""
            },


            class: {
                ru: data.class_ru || "",
                en: data.class_en || "",
                uz: data.class_uz || ""
            },


            purpose: {
                ru: data.purpose_ru || "",
                en: data.purpose_en || "",
                uz: data.purpose_uz || ""
            },


            area: data.area || "",
            ceiling_height: data.ceiling_height || "",
            floor: data.floor || "",
            price: data.price || "",

            images: data.images || []

        });


    }

    const getCommercialById = async (id) => {


        setCommercialPage(null);

        const { data, error } = await supabase
            .from("commercial_pages")
            .select("*")
            .eq("commercial_id", id)
            .maybeSingle();


        if (error) {
            console.error(error);
            return;
        }

        if (!data) {
            await getCommercial(id);
            return;
        }


        setCommercialPage({

            id: data.id,
            commercial_id: data.commercial_id,

            title: {
                ru: data.title_ru || "",
                en: data.title_en || "",
                uz: data.title_uz || ""
            },

            description: {
                ru: data.description_ru || "",
                en: data.description_en || "",
                uz: data.description_uz || ""
            },

            about: {
                ru: data.about_ru || "",
                en: data.about_en || "",
                uz: data.about_uz || ""
            },


            type: {
                ru: data.type_ru || "",
                en: data.type_en || "",
                uz: data.type_uz || ""
            },


            location: {
                ru: data.location_ru || "",
                en: data.location_en || "",
                uz: data.location_uz || ""
            },


            class: {
                ru: data.class_ru || "",
                en: data.class_en || "",
                uz: data.class_uz || ""
            },


            purpose: {
                ru: data.purpose_ru || "",
                en: data.purpose_en || "",
                uz: data.purpose_uz || ""
            },


            area: data.area,
            ceiling_height: data.ceiling_height,
            floor: data.floor,
            price: data.price,

            images: data.images || [],
            amenities: data.amenities || []

        })


    }

    const getCommercial = async (id) => {

        try {

            let { data, error } = await supabase
                .from("commercials_public")
                .select("*")
                .eq("id", id)
                .single();


            if (error && isMissingRelation(error)) {

                ({ data, error } = await supabase
                    .from("commercials")
                    .select(COMMERCIAL_PUBLIC_COLUMNS)
                    .eq("id", id)
                    .single());

            }


            if (error) throw error;


            setCommercialPage({

                id: data.id,

                title: {
                    ru: data.title_ru,
                    en: data.title_en,
                    uz: data.title_uz
                },

                description: {
                    ru: data.description_ru,
                    en: data.description_en,
                    uz: data.description_uz
                },

                floor: data.floor,

                ceiling_height: data.ceiling,

                area: data.area,

                price: data.price,

                image: data.image,

                images: data.images || []

            });


        } catch (err) {

            console.error(err);

            toast.error(
                t("commercialNotFound")
            );

        }

    };


    const changeCard = async (data, id) => {


        const updateData = {


            title_ru: data.title.ru,
            title_en: data.title.en,
            title_uz: data.title.uz,


            description_ru: data.description.ru,
            description_en: data.description.en,
            description_uz: data.description.uz,


            bedrooms_ru: data.bedrooms.ru,
            bedrooms_en: data.bedrooms.en,
            bedrooms_uz: data.bedrooms.uz,


            bathrooms_ru: data.bathrooms.ru,
            bathrooms_en: data.bathrooms.en,
            bathrooms_uz: data.bathrooms.uz,


            price: data.price,

            image: data.image


        };


        const { error } = await supabase
            .from("cardss")
            .update(updateData)
            .eq("id", id);


        if (error) {

            toast.error(error.message);

            return;

        }


        getCards();


        toast.success(
            "Изменено"
        );


    };


    const createCommercialPage = async (page) => {


        const payload = {

            commercial_id: Number(page.commercial_id),

            slug: page.slug,


            title_ru: page.title.ru,
            title_en: page.title.en,
            title_uz: page.title.uz,


            description_ru: page.description.ru,
            description_en: page.description.en,
            description_uz: page.description.uz,


            about_ru: page.about.ru,
            about_en: page.about.en,
            about_uz: page.about.uz,


            location_ru: page.location.ru,
            location_en: page.location.en,
            location_uz: page.location.uz,


            type_ru: page.type.ru,
            type_en: page.type.en,
            type_uz: page.type.uz,


            class_ru: page.class.ru,
            class_en: page.class.en,
            class_uz: page.class.uz,


            purpose_ru: page.purpose.ru,
            purpose_en: page.purpose.en,
            purpose_uz: page.purpose.uz,


            area: Number(page.area) || null,

            ceiling_height:
                Number(page.ceiling_height) || null,

            floor:
                Number(page.floor) || null,

            price:
                Number(page.price) || null,


            images: page.images || [],

            amenities: page.amenities || []

        };


        const { data, error } = await supabase
            .from("commercial_pages")
            .insert([payload])
            .select()
            .single();


        if (error) {

            console.error("CREATE ERROR:", error);

            toast.error(error.message);

            return null;
        }


        return data;

    };
    const deleteCard = async (id) => {


        const { error, count } = await supabase
            .from("cardss")
            .delete({ count: "exact" })
            .eq("id", id);


        if (error) {

            toast.error(
                error.message || t("cardDeleteError")
            );

            return false;

        }


        if (count === 0) {

            toast.error(
                t("cardDeleteForbidden")
            );

            return false;

        }


        await getCards();


        toast.success(
            t("cardDeleted")
        );

        return true;


    };


    const createUserProperty = async (kind, data) => {

        if (!user) {
            toast.error(t("loginRequired"));
            return false;
        }

        // текстовые поля теперь приходят уже переведённые на все 3 языка
        // (см. src/utils/autoTranslate.js + AddProperty.jsx) — просто
        // раскладываем { ru, en, uz } по колонкам _ru/_en/_uz
        const slugBase = (lang) =>
            (lang.ru || lang.en || lang.uz || "listing")
                .toLowerCase()
                .normalize("NFKD")
                .replace(/[^\w-]+/g, "-");

        if (kind === "commercial") {

            const { data: inserted, error } = await supabase
                .from("commercials")
                .insert([{

                    title_ru: data.title.ru, title_en: data.title.en, title_uz: data.title.uz,
                    description_ru: data.description.ru, description_en: data.description.en, description_uz: data.description.uz,
                    district_ru: data.district.ru, district_en: data.district.en, district_uz: data.district.uz,
                    address_ru: data.address.ru, address_en: data.address.en, address_uz: data.address.uz,
                    class_ru: data.class.ru, class_en: data.class.en, class_uz: data.class.uz,
                    landmark_ru: data.landmark.ru, landmark_en: data.landmark.en, landmark_uz: data.landmark.uz,
                    status_ru: data.status.ru, status_en: data.status.en, status_uz: data.status.uz,

                    floor: data.floor,
                    ceiling: data.ceiling,
                    area: data.area,
                    price: data.price,
                    delivery_date: data.deliveryDate || null,

                    image: data.image,

                    created_by: user.id,
                    owner_phone: data.ownerPhone,
                    owner_telegram: data.ownerTelegram

                }])
                .select("id")
                .single();

            if (error) {
                console.error("CREATE USER COMMERCIAL ERROR:", error);
                toast.error(error.message || t("listingCreateError"));
                return false;
            }

            // отдельная "богатая" страница объекта (галерея, преимущества,
            // подробное описание) — без неё страница коммерции была бы
            // почти пустой, т.к. CommercialPage берёт детали именно отсюда
            const { error: pageError } = await supabase
                .from("commercial_pages")
                .insert([{

                    commercial_id: inserted.id,
                    slug: `${slugBase(data.title)}-${inserted.id}`,

                    title_ru: data.title.ru, title_en: data.title.en, title_uz: data.title.uz,
                    description_ru: data.description.ru, description_en: data.description.en, description_uz: data.description.uz,
                    about_ru: data.description.ru, about_en: data.description.en, about_uz: data.description.uz,
                    location_ru: data.address.ru, location_en: data.address.en, location_uz: data.address.uz,
                    type_ru: data.class.ru, type_en: data.class.en, type_uz: data.class.uz,
                    class_ru: data.class.ru, class_en: data.class.en, class_uz: data.class.uz,
                    purpose_ru: data.status.ru, purpose_en: data.status.en, purpose_uz: data.status.uz,

                    area: data.area,
                    ceiling_height: data.ceiling || null,
                    floor: data.floor || null,
                    price: data.price,

                    images: data.images && data.images.length ? data.images : [data.image],
                    amenities: data.amenities || []

                }]);

            if (pageError) {
                // некритично — базовая карточка коммерции уже создана и
                // видна в каталоге, просто без расширенной страницы
                console.error("CREATE USER COMMERCIAL PAGE ERROR:", pageError);
            }

            const { error: leadError } = await supabase
                .from("leads")
                .insert([{
                    type: "commercial_owner",
                    source: "user_listing",
                    name: profile?.name || null,
                    phone: data.ownerPhone || null,
                    telegram: data.ownerTelegram || null,
                    related_commercial_id: inserted.id,
                    status: "new"
                }]);

            if (leadError) {
                console.error("CREATE COMMERCIAL LEAD ERROR:", leadError);
            }

            await getCommercials();
            toast.success(t("listingCreated"));

            return true;

        }

        // kind === "residential" — создаём карточку + виллу к ней,
        // так же, как это делает админ через CreateCard + CreateVilla,
        // только одним шагом и без дублирования на 3 языка вручную
        const { data: card, error: cardError } = await supabase
            .from("cardss")
            .insert([{

                title_ru: data.title.ru, title_en: data.title.en, title_uz: data.title.uz,
                description_ru: data.description.ru, description_en: data.description.en, description_uz: data.description.uz,
                bedrooms_ru: data.bedrooms, bedrooms_en: data.bedrooms, bedrooms_uz: data.bedrooms,
                bathrooms_ru: data.bathrooms, bathrooms_en: data.bathrooms, bathrooms_uz: data.bathrooms,
                type_ru: data.type.ru, type_en: data.type.en, type_uz: data.type.uz,

                price: data.price,
                image: data.image,

                created_by: user.id,
                owner_phone: data.ownerPhone,
                owner_telegram: data.ownerTelegram

            }])
            .select("id")
            .single();

        if (cardError) {
            console.error("CREATE USER CARD ERROR:", cardError);
            toast.error(cardError.message || t("listingCreateError"));
            return false;
        }

        const { error: villaError } = await supabase
            .from("villas")
            .insert([{

                card_id: card.id,
                slug: `${slugBase(data.title)}-${card.id}`,

                title_ru: data.title.ru, title_en: data.title.en, title_uz: data.title.uz,
                description_ru: data.description.ru, description_en: data.description.en, description_uz: data.description.uz,
                about_ru: data.about.ru, about_en: data.about.en, about_uz: data.about.uz,
                location_ru: data.location.ru, location_en: data.location.en, location_uz: data.location.uz,
                type_ru: data.type.ru, type_en: data.type.en, type_uz: data.type.uz,

                price: data.price,
                bedrooms: data.bedrooms,
                year: data.year || null,
                square: data.square || null,

                images: data.images && data.images.length ? data.images : [data.image],
                amenities: data.amenities || []

            }]);

        if (villaError) {

            console.error("CREATE USER VILLA ERROR:", villaError);
            toast.error(villaError.message || t("listingCreateError"));

            // карточка уже создана, но без виллы — подчищаем, чтобы не
            // оставлять "битую" карточку без деталей объекта
            await supabase.from("cardss").delete().eq("id", card.id);

            return false;

        }

        await supabase
            .from("cardss")
            .update({ link: `/property/${card.id}` })
            .eq("id", card.id);

        const { error: leadError } = await supabase
            .from("leads")
            .insert([{
                type: "listing_owner",
                source: "user_listing",
                name: profile?.name || null,
                phone: data.ownerPhone || null,
                telegram: data.ownerTelegram || null,
                related_card_id: card.id,
                status: "new"
            }]);

        if (leadError) {
            console.error("CREATE LISTING LEAD ERROR:", leadError);
        }

        await getCards();
        toast.success(t("listingCreated"));

        return true;

    };


    // Полные данные СВОЕГО объявления (включая owner_phone/telegram) —
    // для формы редактирования. Обычный select их не отдаст (см.
    // cardss_public / колоночные GRANT), поэтому используем RPC
    // get_my_listing_full (security definer + проверка created_by внутри).
    const getMyListingFull = async (kind, id) => {

        const { data, error } = await supabase.rpc("get_my_listing_full", {
            p_kind: kind,
            p_id: Number(id)
        });

        if (error) {
            console.error("GET MY LISTING FULL ERROR:", error);
            toast.error(t("listingLoadError"));
            return null;
        }

        if (!data) {
            toast.error(t("listingNotFound"));
            return null;
        }

        return data;

    };


    // Редактирование уже опубликованного объявления пользователем —
    // те же 2 таблицы, что и при создании (cardss+villas или
    // commercials+commercial_pages), только update вместо insert.
    // RLS (_update_own политики) уже проверяет владельца на уровне базы,
    // так что здесь просто передаём id, который взяли из своего же списка.
    const updateUserProperty = async (kind, id, data) => {

        if (!user) {
            toast.error(t("loginRequired"));
            return false;
        }

        if (kind === "commercial") {

            const { error: commercialError } = await supabase
                .from("commercials")
                .update({

                    title_ru: data.title.ru, title_en: data.title.en, title_uz: data.title.uz,
                    description_ru: data.description.ru, description_en: data.description.en, description_uz: data.description.uz,
                    district_ru: data.district.ru, district_en: data.district.en, district_uz: data.district.uz,
                    address_ru: data.address.ru, address_en: data.address.en, address_uz: data.address.uz,
                    class_ru: data.class.ru, class_en: data.class.en, class_uz: data.class.uz,
                    landmark_ru: data.landmark.ru, landmark_en: data.landmark.en, landmark_uz: data.landmark.uz,
                    status_ru: data.status.ru, status_en: data.status.en, status_uz: data.status.uz,

                    floor: data.floor,
                    ceiling: data.ceiling,
                    area: data.area,
                    price: data.price,
                    delivery_date: data.deliveryDate || null,

                    image: data.image,

                    owner_phone: data.ownerPhone,
                    owner_telegram: data.ownerTelegram

                })
                .eq("id", id);

            if (commercialError) {
                console.error("UPDATE USER COMMERCIAL ERROR:", commercialError);
                toast.error(commercialError.message || t("listingUpdateError"));
                return false;
            }

            const { error: pageError } = await supabase
                .from("commercial_pages")
                .update({

                    title_ru: data.title.ru, title_en: data.title.en, title_uz: data.title.uz,
                    description_ru: data.description.ru, description_en: data.description.en, description_uz: data.description.uz,
                    about_ru: data.description.ru, about_en: data.description.en, about_uz: data.description.uz,
                    location_ru: data.address.ru, location_en: data.address.en, location_uz: data.address.uz,
                    type_ru: data.class.ru, type_en: data.class.en, type_uz: data.class.uz,
                    class_ru: data.class.ru, class_en: data.class.en, class_uz: data.class.uz,
                    purpose_ru: data.status.ru, purpose_en: data.status.en, purpose_uz: data.status.uz,

                    area: data.area,
                    ceiling_height: data.ceiling || null,
                    floor: data.floor || null,
                    price: data.price,

                    images: data.images && data.images.length ? data.images : [data.image],
                    amenities: data.amenities || []

                })
                .eq("commercial_id", id);

            if (pageError) {
                console.error("UPDATE USER COMMERCIAL PAGE ERROR:", pageError);
            }

            await getCommercials();
            toast.success(t("listingUpdated"));

            return true;

        }

        const { error: cardError } = await supabase
            .from("cardss")
            .update({

                title_ru: data.title.ru, title_en: data.title.en, title_uz: data.title.uz,
                description_ru: data.description.ru, description_en: data.description.en, description_uz: data.description.uz,
                bedrooms_ru: data.bedrooms, bedrooms_en: data.bedrooms, bedrooms_uz: data.bedrooms,
                bathrooms_ru: data.bathrooms, bathrooms_en: data.bathrooms, bathrooms_uz: data.bathrooms,
                type_ru: data.type.ru, type_en: data.type.en, type_uz: data.type.uz,

                price: data.price,
                image: data.image,

                owner_phone: data.ownerPhone,
                owner_telegram: data.ownerTelegram

            })
            .eq("id", id);

        if (cardError) {
            console.error("UPDATE USER CARD ERROR:", cardError);
            toast.error(cardError.message || t("listingUpdateError"));
            return false;
        }

        const { error: villaError } = await supabase
            .from("villas")
            .update({

                title_ru: data.title.ru, title_en: data.title.en, title_uz: data.title.uz,
                description_ru: data.description.ru, description_en: data.description.en, description_uz: data.description.uz,
                about_ru: data.about.ru, about_en: data.about.en, about_uz: data.about.uz,
                location_ru: data.location.ru, location_en: data.location.en, location_uz: data.location.uz,
                type_ru: data.type.ru, type_en: data.type.en, type_uz: data.type.uz,

                price: data.price,
                bedrooms: data.bedrooms,
                year: data.year || null,
                square: data.square || null,

                images: data.images && data.images.length ? data.images : [data.image],
                amenities: data.amenities || []

            })
            .eq("card_id", id);

        if (villaError) {
            console.error("UPDATE USER VILLA ERROR:", villaError);
            toast.error(villaError.message || t("listingUpdateError"));
            return false;
        }

        await getCards();
        toast.success(t("listingUpdated"));

        return true;

    };


    const getMyListings = async () => {

        if (!user) return [];

        let [cardsRes, commercialsRes] = await Promise.all([

            supabase
                .from("cardss_public")
                .select("*")
                .eq("created_by", user.id)
                .order("id", { ascending: false }),

            supabase
                .from("commercials_public")
                .select("*")
                .eq("created_by", user.id)
                .order("id", { ascending: false })

        ]);

        if (isMissingRelation(cardsRes.error)) {

            cardsRes = await supabase
                .from("cardss")
                .select(CARD_PUBLIC_COLUMNS)
                .eq("created_by", user.id)
                .order("id", { ascending: false });

        }

        if (isMissingRelation(commercialsRes.error)) {

            commercialsRes = await supabase
                .from("commercials")
                .select(COMMERCIAL_PUBLIC_COLUMNS)
                .eq("created_by", user.id)
                .order("id", { ascending: false });

        }

        if (cardsRes.error) {
            console.error("GET MY LISTINGS (cards) ERROR:", cardsRes.error);
        }

        if (commercialsRes.error) {
            console.error("GET MY LISTINGS (commercials) ERROR:", commercialsRes.error);
        }

        if (cardsRes.error && commercialsRes.error) {
            toast.error(t("listingsLoadError"));
        }

        const cards = (cardsRes.data || []).map((item) => ({
            ...item,
            kind: "residential"
        }));

        const commercials = (commercialsRes.data || []).map((item) => ({
            ...item,
            kind: "commercial"
        }));

        return [...cards, ...commercials].sort((a, b) => b.id - a.id);

    };


    const getLeads = async (statusFilter) => {

        let request = supabase
            .from("leads")
            .select("*")
            .order("created_at", { ascending: false });

        if (statusFilter && statusFilter !== "all") {
            request = request.eq("status", statusFilter);
        }

        const { data, error } = await request;

        if (error) {
            console.error("GET LEADS ERROR:", error);
            toast.error("Ошибка загрузки заявок");
            return [];
        }

        return data || [];

    };


    const updateLeadStatus = async (id, status) => {

        const { data, error } = await supabase
            .from("leads")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("UPDATE LEAD STATUS ERROR:", error);
            toast.error("Не удалось обновить статус заявки");
            return false;
        }

        toast.success("Статус обновлён");
        return data;

    };


    const getVilla = async (id) => {


        try {


            const { data, error } = await supabase
                .from("villas")
                .select("*")
                .eq("card_id", Number(id))
                .order("id", {
                    ascending: false
                })
                .limit(1)
                .maybeSingle();


            if (error) throw error;


            if (!data) {

                toast.error(
                    t("villaNotFound")
                );

                return;

            }


            setVilla({


                id: data.id,


                title: {

                    ru: data.title_ru,
                    en: data.title_en,
                    uz: data.title_uz

                },


                description: {

                    ru: data.description_ru,
                    en: data.description_en,
                    uz: data.description_uz

                },


                about: {

                    ru: data.about_ru,
                    en: data.about_en,
                    uz: data.about_uz

                },


                location: {

                    ru: data.location_ru,
                    en: data.location_en,
                    uz: data.location_uz

                },


                type: {

                    ru: data.type_ru,
                    en: data.type_en,
                    uz: data.type_uz

                },


                price: data.price,

                bedrooms: data.bedrooms,

                year: data.year,

                square: data.square,


                images: data.images || [],

                amenities: data.amenities || []


            });


        } catch (err) {


            console.error(err);

        }


    };


    const createVilla = async (data) => {


        try {


            const { data: villa, error } = await supabase
                .from("villas")
                .insert([{


                    card_id: data.card_id || null,


                    title_ru: data.title.ru,
                    title_en: data.title.en,
                    title_uz: data.title.uz,


                    slug: data.slug ||
                        data.title.ru
                            .toLowerCase()
                            .replaceAll(" ", "-"),


                    description_ru: data.description.ru,
                    description_en: data.description.en,
                    description_uz: data.description.uz,


                    about_ru: data.about.ru,
                    about_en: data.about.en,
                    about_uz: data.about.uz,


                    location_ru: data.location.ru,
                    location_en: data.location.en,
                    location_uz: data.location.uz,


                    type_ru: data.type.ru,
                    type_en: data.type.en,
                    type_uz: data.type.uz,


                    price: data.price,


                    bedrooms: data.bedrooms,

                    year: data.year,

                    square: data.square,


                    images: data.images,

                    amenities: data.amenities


                }])
                .select()
                .single();


            if (error) throw error;


            if (data.card_id) {


                await supabase
                    .from("cardss")
                    .update({

                        link:
                            `/property/${data.card_id}`

                    })
                    .eq(
                        "id",
                        data.card_id
                    );


            }


            toast.success(
                "Вилла создана"
            );


        } catch (error) {


            console.error(error);


            toast.error(
                error.message
            );


        }


    };


    const updateVilla = async (data, id) => {


        const { data: updated, error } = await supabase
            .from("villas")
            .update({


                title_ru: data.title.ru,
                title_en: data.title.en,
                title_uz: data.title.uz,


                description_ru: data.description.ru,
                description_en: data.description.en,
                description_uz: data.description.uz,


                about_ru: data.about.ru,
                about_en: data.about.en,
                about_uz: data.about.uz,


                location_ru: data.location.ru,
                location_en: data.location.en,
                location_uz: data.location.uz,


                type_ru: data.type.ru,
                type_en: data.type.en,
                type_uz: data.type.uz,


                price: data.price,

                bedrooms: Number(data.bedrooms),

                year: data.year,

                square: data.square,


                images: data.images,

                amenities: data.amenities


            })
            .eq("id", id)
            .select();


        if (error) {

            toast.error(error.message);

            return;

        }


        if (!updated.length) {

            toast.error(
                "Строка не найдена"
            );

            return;

        }


        toast.success(
            "Изменено"
        );


        setVilla(prev => ({

            ...prev,

            ...data

        }));


    };


    const deleteVilla = async (id) => {


        const { error } = await supabase
            .from("villas")
            .delete()
            .eq("id", id);


        if (error) {

            toast.error(error.message);

            return;

        }


        setVilla(null);


        toast.success(
            "Villa удалена"
        );


    };


    const ALLOWED_IMAGE_TYPES = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    ];

    const MAX_IMAGE_SIZE_MB = 8;

    const uploadImage = async (file) => {

        if (!file) {
            toast.error(t("imageFileMissing"));
            return;
        }

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            toast.error(
                t("imageFileTypeError")
            );
            return;
        }

        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
            toast.error(
                t("imageFileSizeError", { max: MAX_IMAGE_SIZE_MB })
            );
            return;
        }

        const safeName = file.name
            .normalize("NFKD")
            .replace(/[^\w.\-]/g, "_");

        const fileName =
            `${Date.now()}-${safeName}`;


        const { error } = await supabase.storage
            .from("images")
            .upload(
                fileName,
                file
            );


        if (error) {


            toast.error(
                t("imageUploadError")
            );

            console.error(error);

            return;

        }


        const { data } = supabase.storage
            .from("images")
            .getPublicUrl(
                fileName
            );


        return data.publicUrl;


    };
    const updateCommercialPage = async (page) => {


        const payload = {


            title_ru: page.title.ru,
            title_en: page.title.en,
            title_uz: page.title.uz,


            description_ru: page.description.ru,
            description_en: page.description.en,
            description_uz: page.description.uz,


            location_ru: page.location.ru,
            location_en: page.location.en,
            location_uz: page.location.uz,


            type_ru: page.type.ru,
            type_en: page.type.en,
            type_uz: page.type.uz,


            class_ru: page.class.ru,
            class_en: page.class.en,
            class_uz: page.class.uz,


            purpose_ru: page.purpose.ru,
            purpose_en: page.purpose.en,
            purpose_uz: page.purpose.uz,


            area: Number(page.area),

            ceiling_height: Number(page.ceiling_height),

            floor: Number(page.floor),

            price: Number(page.price),


            images: page.images,

            amenities: page.amenities

        }


        const { data, error } = await supabase
            .from("commercial_pages")
            .update(payload)
            .eq("id", page.id)
            .select();


        if (error) {

            console.error("UPDATE ERROR", error);

            return false;

        }


        return true;


    }
    const deleteCommercialPage = async (id) => {


        const { error } = await supabase
            .from("commercial_pages")
            .delete()
            .eq("id", id);


        if (error) {

            toast.error(error.message);
            return;

        }


        toast.success("Удалено");


    };


    const getCommercialPages = async () => {


        const { data, error } = await supabase
            .from("commercial_pages")
            .select("*")
            .order("id", { ascending: false })


        if (error) {
            console.error(error)
            return;
        }


        setCommercialPages(

            data.map(item => ({

                id: item.id,

                commercial_id: item.commercial_id,


                title: {
                    ru: item.title_ru,
                    en: item.title_en,
                    uz: item.title_uz
                },


                location: {
                    ru: item.location_ru,
                    en: item.location_en,
                    uz: item.location_uz
                },


                images: item.images || []


            }))

        )


    }


    const getProfile = async (id) => {

        const result = await supabase

            .from("profiles")
            .select("*")
            .eq("id", id)
            .maybeSingle();

        return result;
    };


    const loadProfile = async (id) => {
        const requestId = ++authProfileRequest.current;

        const result = await getProfile(id);

        if (
            requestId !== authProfileRequest.current ||
            result.error
        ) {
            return;
        }

        setProfile(result.data ?? null);
    };


    useEffect(() => {

        let alive = true;


        async function initAuth() {
            if (window.location.pathname === "/reset-password") {
                setAuthLoading(false);
                return;
            }


            const result = await supabase.auth.getSession();

            const session = result.data.session;


            if (!alive) return;


            setUser(session?.user ?? null);


            if (session?.user) {
                await loadProfile(session.user.id);

            }


            if (alive) {
                setAuthLoading(false);
            }


        }


        initAuth();


        const {
            data: listener
        } = supabase.auth.onAuthStateChange(
            (event, session) => {

                if (window.location.pathname === "/reset-password") {
                    setAuthLoading(false);
                    return;
                }


                setUser(session?.user ?? null);


                if (!session?.user) {

                    authProfileRequest.current += 1;
                    setProfile(null);

                } else if (event !== "TOKEN_REFRESHED") {

                    window.setTimeout(() => {
                        if (!alive) return;
                        loadProfile(session.user.id);
                    }, 0);

                }


                setAuthLoading(false);

            }
        );


        return () => {

            alive = false;

            listener.subscription.unsubscribe();

        };


    }, []);

    const updateProfile = async (values) => {

        if (!user?.id) return false;


        const { data, error } =
            await supabase
                .from("profiles")
                .update(values)
                .eq("id", user.id)
                .select()
                .single();


        if (error) {

            console.error("PROFILE UPDATE ERROR:", error);
            return false;

        }


        setProfile(data);


        return data;

    };

    // Ручная активация буста ("объявление в топе") — вызывается админом
    // после того как оплата подтверждена вне сайта (Payme/Click/перевод).
    // kind: "residential" | "commercial", days: сколько дней держать в топе.
    const setBoost = async (kind, id, days) => {

        const table = kind === "commercial" ? "commercials" : "cardss";

        const boosted_until = days
            ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
            : null; // null — снять буст досрочно

        const { error } = await supabase
            .from(table)
            .update({ boosted_until })
            .eq("id", id);

        if (error) {
            console.error("SET BOOST ERROR:", error);
            toast.error(error.message);
            return false;
        }

        toast.success(
            days ? `Объявление в топе на ${days} дн.` : "Буст снят"
        );

        return true;

    };

    const setUserRole = async (targetUserId, role) => {

        if (!["user", "admin"].includes(role)) {
            toast.error("Некорректная роль");
            return false;
        }

        const { data, error } =
            await supabase
                .from("profiles")
                .update({ role })
                .eq("id", targetUserId)
                .select()
                .single();

        if (error) {
            console.error("SET ROLE ERROR:", error);
            toast.error(error.message);
            return false;
        }

        toast.success(
            role === "admin"
                ? "Пользователь назначен админом"
                : "Права админа сняты"
        );

        return data;

    };

    const searchUsers = async (query) => {

        let request = supabase
            .from("profiles")
            .select("id, name, surname, city, role, avatar_url")
            .order("name", { ascending: true })
            .limit(50);

        if (query?.trim()) {
            request = request.or(
                `name.ilike.%${query}%,surname.ilike.%${query}%`
            );
        }

        const { data, error } = await request;

        if (error) {
            console.error("SEARCH USERS ERROR:", error);
            toast.error("Ошибка поиска");
            return [];
        }

        return data;

    };


    const getFavorites = async () => {

        if (!user) {
            setFavorites([]);
            return;
        }

        setFavoritesLoading(true);

        try {

            const { data, error } = await supabase
                .from("favorites")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;

            setFavorites(data || []);

        } catch (error) {

            console.error("GET FAVORITES ERROR:", error);
            toast.error(t("favoritesLoadError"));

        } finally {

            setFavoritesLoading(false);

        }

    };


    const isFavorite = (itemId, itemType) => {

        return favorites.some(
            fav => fav.item_id === String(itemId) && fav.item_type === itemType
        );

    };


    const toggleFavorite = async (item) => {


        if (!user) {
            toast.info(t("favoriteLoginRequired"));
            return;
        }

        const existing = favorites.find(
            fav => fav.item_id === String(item.id) && fav.item_type === item.type
        );

        try {

            if (existing) {

                const { error } = await supabase
                    .from("favorites")
                    .delete()
                    .eq("id", existing.id);

                if (error) throw error;

                setFavorites(prev =>
                    prev.filter(fav => fav.id !== existing.id)
                );

            } else {

                const { data, error } = await supabase
                    .from("favorites")
                    .insert([{
                        user_id: user.id,
                        item_id: String(item.id),
                        item_type: item.type,
                        title: item.title || "",
                        image: item.image || "",
                        price: item.price || "",
                        link: item.link || ""
                    }])
                    .select()
                    .single();

                if (error) throw error;

                setFavorites(prev => [data, ...prev]);

            }

        } catch (error) {

            console.error("TOGGLE FAVORITE ERROR:", error);
            toast.error(t("favoritesUpdateError"));

        }

    };


    useEffect(() => {

        if (user) {
            getFavorites();
        } else {
            setFavorites([]);
        }

    }, [user]);


    return (

        <MyContext.Provider value={{


            setUserRole,
            setBoost,
            searchUsers,

            properties,
            deleteCommercial,

            getCards,

            getLatestCards,


            createCard,

            deleteCard,

            changeCard,


            getCardId,


            cardId,

            setCardId,


            createVilla,


            deleteVilla,


            getVilla,


            villa,


            setVilla,


            updateVilla,





            user,
            profile,
            authLoading,
            logout,


            isDark,

            updateCommercial,
            handleDark,


            isBurger,


            handleBurger,


            uploadImage,


            commercials,

            getCommercials,
            createCommercial,

            commercialPage,
            setCommercialPage,
            getCommercialPage,
            getCommercial,

            createCommercialPage,
            updateCommercialPage,
            deleteCommercialPage,
            getCommercialPages,
            commercialPages,
            deleteCommercialPage,
            getCommercialById,
            updateProfile,


            favorites,
            favoritesLoading,
            getFavorites,
            isFavorite,
            toggleFavorite,

            createUserProperty,
            updateUserProperty,
            getMyListingFull,
            getMyListings,
            getLeads,
            updateLeadStatus
        }}>


            {children}


        </MyContext.Provider>


    );


};