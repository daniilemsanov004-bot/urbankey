import { Link, useParams } from 'react-router-dom'
import s from './Featured.module.css'
import { motion } from "framer-motion"
import { useTranslation } from 'react-i18next'
import { useContext, useEffect, useState, useRef, useLayoutEffect, useMemo } from "react";
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Autoplay, Mousewheel } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/navigation'

import { MyContext } from '../Context';
import { localizedPath } from '../utils/lang';
import { useCurrency } from '../context/CurrencyContext';
import { formatPriceIn } from '../utils/currency';
import { Building2, Ruler, Tag } from 'lucide-react';

const readMoreLabels = {
    ru: { more: "Подробнее", less: "Скрыть" },
    en: { more: "Show more", less: "Show less" },
    uz: { more: "Batafsil", less: "Yopish" },
};


const Feautured = ({ data, commercial, items }) => {


    const {
        properties,
        commercials,
        profile,
        getCards,
        getCommercials,
        deleteCard,
        deleteCommercial
    } = useContext(MyContext);

    // isAdmin в контексте никогда не существовал (всегда был undefined) —
    // из-за этого кнопка "Удалить" тут не отображалась вообще никогда.
    // Считаем так же, как в Catalog.jsx/CommercialSection.jsx.
    const isAdmin = profile?.role === "admin";



    useEffect(() => {

        // Раньше здесь всегда грузились ЖИЛЫЕ объекты (getCards/properties),
        // даже на странице коммерческой недвижимости — из-за этого "похожие
        // объекты" под коммерческим объявлением на самом деле были виллами.
        // Теперь берём правильный источник в зависимости от типа страницы.
        if (commercial) {
            getCommercials();
        } else {
            getCards();
        }

    }, [commercial]);




    const { t, i18n } = useTranslation();
    const { currency } = useCurrency();

    const [expanded, setExpanded] = useState({});
    const [overflowing, setOverflowing] = useState({});
    const descRefs = useRef({});

    const toggleExpanded = (id) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const setDescRef = (id) => (el) => {
        descRefs.current[id] = el;
    };

    const labels = readMoreLabels[i18n.language] || readMoreLabels.ru;







    const list = items || (commercial ? commercials : properties);

    // Самый надёжный источник "какой объект сейчас открыт" — id из самого URL
    // (/property/:id, /commercial/:id), а не поля из связанных таблиц:
    // villa.id — это id строки в таблице villas, а не в cardss (откуда properties).
    // commercialPage.id (если страница открыта через getCommercialById) — это id
    // строки в commercial_pages, а не в commercials. Оба поля ненадёжны (могут
    // быть не тем id или не заполнены), поэтому берём id прямо из адресной строки.
    const { id: routeId } = useParams();
    const routeIdNum = routeId !== undefined ? Number(routeId) : undefined;

    const currentId = !Number.isNaN(routeIdNum) && routeIdNum !== undefined
        ? routeIdNum
        : commercial
            ? (data?.commercial_id ?? data?.id)
            : (data?.card_id ?? data?.id);

    const similar = useMemo(() => list
        .filter(item => String(item.id) !== String(currentId))
        .map(item => {

            let score = 0;


            if (
                item.type?.ru &&
                data?.type?.ru &&
                item.type.ru === data.type.ru
            ) score += 5;


            if (
                item.class?.ru &&
                data?.class?.ru &&
                item.class.ru === data.class.ru
            ) score += 3;


            if (
                item.district?.ru &&
                data?.district?.ru &&
                item.district.ru === data.district.ru
            ) score += 3;


            if (
                item.area &&
                data?.area &&
                Math.abs(item.area - data.area) < 50
            ) score += 2;


            // Спальни раньше вообще не участвовали в подборе похожих —
            // а это единственный явный признак сходства для жилой недвижимости,
            // раз district/class у неё в базе не хранятся.
            if (
                item.bedrooms?.ru &&
                data?.bedrooms?.ru &&
                item.bedrooms.ru === data.bedrooms.ru
            ) score += 3;


            // Цена — единственное числовое поле, доступное и у жилья, и у коммерции.
            // Раньше не учитывалась вовсе — похожими считались случайные объекты
            // одного типа, вне зависимости от того, насколько разнится стоимость.
            if (
                item.price &&
                data?.price &&
                Math.abs(item.price - data.price) / data.price <= 0.25
            ) score += 2;


            return {
                ...item,
                score
            }

        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3), [list, currentId, data?.type?.ru, data?.class?.ru, data?.district?.ru, data?.area, data?.bedrooms?.ru, data?.price]);

    useLayoutEffect(() => {
        const next = {};
        Object.entries(descRefs.current).forEach(([id, el]) => {
            if (!el) return;
            next[id] = el.scrollHeight - el.clientHeight > 1;
        });
        setOverflowing((prev) => {
            const prevKeys = Object.keys(prev);
            const nextKeys = Object.keys(next);
            const same =
                prevKeys.length === nextKeys.length &&
                nextKeys.every((k) => prev[k] === next[k]);
            return same ? prev : next;
        });
    }, [similar, i18n.language]);

    if (similar.length === 0) {
        return null;
    }

    return (

        <section
            className={s.feautured}
            id='feautured'
        >


            <div className={s.text}>


                <img
                    src="/Abstract Design.svg"
                    alt=""
                    className={s.logo}
                />


                <h2>
                    {t("featuredTitle")}
                </h2>


                <div className={s.titles}>


                    <p>
                        {t("featuredText")}
                    </p>


                    <Link
                        className={s.link}
                        to={localizedPath("/Properties", i18n.language)}
                    >

                        {t("viewAll")}

                    </Link>


                </div>


            </div>





            <Swiper

                modules={[
                    Navigation,
                    Autoplay,
                    Mousewheel
                ]}

                spaceBetween={30}

                slidesPerView={3}

                loop={similar.length > 3}

                navigation={true}


                mousewheel={{
                    forceToAxis: true
                }}


                autoplay={{
                    delay: 5500,
                    disableOnInteraction: false
                }}



                breakpoints={{

                    0: {
                        slidesPerView: 1
                    },


                    768: {
                        slidesPerView: 2
                    },


                    1200: {
                        slidesPerView: 3
                    }

                }}


                className={s.cards}

            >




                {similar.map((item) => (


                    <SwiperSlide
                        key={item.id}
                    >


                        <motion.div

                            className={s.card}


                            initial={{
                                opacity: 0,
                                y: 80
                            }}


                            whileInView={{
                                opacity: 1,
                                y: 0
                            }}


                            transition={{
                                duration: 0.8
                            }}


                            viewport={{
                                amount: 0.2
                            }}


                            whileHover={{
                                y: -10
                            }}

                        >



                            <div className={s.imageWrap}>

                                <img

                                    src={item.image}

                                    alt={
                                        item.title?.[i18n.language]
                                    }

                                    className={s.image}

                                    loading="lazy"

                                    decoding="async"

                                />

                            </div>



                            <h2>

                                {item.title?.[i18n.language]}

                            </h2>


                            <div className={s.meta}>

                                {commercial ? (

                                    <>

                                        <span className={s.metaItem}>
                                            <Building2 size={16} className={s.metaIcon} />
                                            <span>
                                                {item.floor}
                                                {i18n.language === "ru" ? " этаж" : i18n.language === "uz" ? " qavat" : " floor"}
                                            </span>
                                        </span>

                                        <span className={s.metaItem}>
                                            <Ruler size={16} className={s.metaIcon} />
                                            <span>{item.area ? `${item.area} m²` : "—"}</span>
                                        </span>

                                        {item.class?.[i18n.language] && (
                                            <span className={s.metaItem}>
                                                <Tag size={16} className={s.metaIcon} />
                                                <span>{item.class[i18n.language]}</span>
                                            </span>
                                        )}

                                    </>

                                ) : (

                                    <>

                                        <span className={s.metaItem}>

                                            <svg className={s.metaIcon} width="20" height="17" viewBox="0 0 20 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M10.0119 15.4597C7.01369 15.4597 4.01627 15.4597 1.01806 15.4597C0.714934 15.4597 0.574786 15.5984 0.574786 15.8977C0.574786 15.9752 0.578723 16.0527 0.573999 16.1295C0.5677 16.2225 0.558252 16.3155 0.54093 16.4062C0.476368 16.7372 0.159068 17.0023 -0.220432 16.9984C-0.601507 16.9946 -0.917233 16.7116 -0.974709 16.3481C-0.988094 16.2628 -0.99518 16.1752 -0.99518 16.0891C-0.995967 14.3279 -1.00778 12.5659 -0.991243 10.8046C-0.981795 9.77829 -0.602295 8.88527 0.125212 8.14186C0.566913 7.69069 1.09207 7.36976 1.69282 7.16511C2.16522 7.00465 2.65338 6.95581 3.15098 6.95581C7.76246 6.95736 12.3739 6.95348 16.9854 6.95891C18.3365 6.96046 19.4309 7.4969 20.2419 8.56356C20.6403 9.08837 20.8781 9.68449 20.9592 10.3357C20.9867 10.555 20.9985 10.7783 20.9993 11C21.0025 12.7101 21.0017 14.4202 21.0009 16.1302C21.0009 16.3977 20.934 16.6411 20.7104 16.8178C20.4741 17.0046 20.2104 17.0535 19.9293 16.9395C19.66 16.8295 19.49 16.6271 19.4514 16.338C19.4317 16.1922 19.4341 16.0426 19.4301 15.8953C19.4238 15.6574 19.3238 15.5139 19.1239 15.4698C19.0798 15.4597 19.0333 15.4605 18.9876 15.4605C15.9965 15.4605 13.0054 15.4605 10.0135 15.4605L10.0119 15.4597Z" fill="currentColor" />
                                                <path d="M9.90246 0C11.8472 0 13.7912 0 15.7351 0C16.3862 0 16.9949 0.143411 17.52 0.539535C18.1956 1.04884 18.59 1.71938 18.6231 2.56124C18.6514 3.27519 18.6388 3.9907 18.642 4.70543C18.6444 5.16589 18.642 5.62636 18.642 6.08682C18.642 6.12791 18.6396 6.17132 18.6286 6.21085C18.5948 6.33566 18.5263 6.38527 18.3971 6.36124C18.2562 6.33488 18.12 6.27829 17.979 6.26279C17.6476 6.22713 17.3153 6.20233 16.9823 6.18527C16.7602 6.17364 16.6917 6.13411 16.6602 5.91938C16.5595 5.23876 15.9194 4.62636 15.1005 4.63566C14.1872 4.64574 13.2739 4.63798 12.3613 4.63798C11.6819 4.63798 11.1016 5.03643 10.8709 5.66434C10.8378 5.75426 10.8252 5.85194 10.8079 5.94651C10.7756 6.11628 10.7119 6.17984 10.5402 6.18217C10.1804 6.18605 9.81979 6.18605 9.45997 6.18217C9.29463 6.18062 9.22928 6.11628 9.19936 5.92791C9.15763 5.66357 9.0537 5.42791 8.88364 5.22093C8.57579 4.84574 8.17739 4.64186 7.68609 4.63953C6.74363 4.63488 5.80118 4.63721 4.85794 4.63876C4.06587 4.63953 3.44623 5.24884 3.34545 5.91783C3.31317 6.13411 3.24782 6.17209 3.02579 6.18605C2.6581 6.21008 2.29041 6.24419 1.92351 6.28295C1.81092 6.29457 1.70305 6.34264 1.59125 6.36124C1.47078 6.38062 1.41488 6.34031 1.38103 6.22403C1.36764 6.17829 1.36134 6.12946 1.36134 6.0814C1.36055 4.97674 1.3456 3.87209 1.36449 2.76744C1.38418 1.61163 1.92666 0.762016 2.988 0.248062C3.40844 0.0457364 3.86431 0 4.3257 0C6.18462 0 8.04354 0 9.90246 0Z" fill="currentColor" />
                                            </svg>

                                            <span>{item.bedrooms?.[i18n.language] || "—"}</span>

                                        </span>

                                        <span className={s.metaItem}>

                                            <svg className={s.metaIcon} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M0.269455 13.7616H10.11V15.5697H16.2615V13.7655H18.7054C18.8637 15.9158 18.8761 17.8304 16.6707 19.2897C16.6437 19.3075 16.6221 19.3318 16.5623 19.385C16.8335 19.6103 17.1009 19.8329 17.3655 20.0529C17.0082 20.3945 16.7212 20.669 16.3922 20.9842C16.1019 20.6848 15.7879 20.3373 15.4458 20.0207C15.3453 19.9275 15.1673 19.8894 15.0215 19.8802C14.7831 19.8657 14.5414 19.9045 14.301 19.9052C11.1057 19.9071 7.91048 19.9065 4.71457 19.9065C4.56154 19.9065 4.398 19.936 4.25679 19.8933C3.83054 19.7653 3.55994 19.9629 3.30642 20.2684C3.09034 20.5284 2.84405 20.7629 2.61877 21.0007C2.31468 20.6808 2.03949 20.3918 1.73474 20.0707C1.939 19.89 2.19843 19.6602 2.49004 19.4014C2.28906 19.2576 2.13866 19.1577 1.99614 19.0474C0.928209 18.2244 0.350896 17.1329 0.275366 15.7924C0.23793 15.1284 0.268798 14.4604 0.268798 13.7616H0.269455Z" fill="currentColor" />
                                                <path d="M0.275543 8.78712C0.270288 8.66825 0.261093 8.56119 0.261093 8.45413C0.260437 6.71366 0.258466 4.97384 0.261093 3.23336C0.26372 1.32081 1.59108 -0.0137781 3.50101 1.43622e-05C4.14203 0.00461185 4.80275 -0.00852383 5.41882 0.136625C6.5117 0.394741 7.20001 1.15267 7.53235 2.2206C7.59671 2.42814 7.68012 2.52863 7.90803 2.59037C9.19401 2.93912 10.0964 4.14104 10.1128 5.48219C10.1155 5.69827 10.1128 5.91435 10.1128 6.14882H4.02578C3.73548 4.61392 4.56959 3.02976 6.31335 2.5352C6.15573 1.85017 5.48121 1.2722 4.7732 1.24725C4.23792 1.2282 3.70067 1.22623 3.16539 1.24725C2.24261 1.28337 1.50044 2.13062 1.4965 3.14666C1.48994 4.89765 1.49453 6.64929 1.49453 8.40028C1.49453 8.51981 1.49453 8.63935 1.49453 8.78647H0.274229L0.275543 8.78712Z" fill="currentColor" />
                                                <path d="M10.0931 12.5327C9.96436 12.5327 9.86781 12.5327 9.77126 12.5327C6.64366 12.5327 3.5154 12.5334 0.387794 12.5321C-0.285409 12.5321 -0.769459 12.2135 -0.939566 11.6697C-1.19571 10.8514 -0.615771 10.0632 0.268259 10.0514C1.20877 10.0389 2.14929 10.0481 3.0898 10.0481C5.29922 10.0481 7.50799 10.0481 9.71741 10.0481C9.83563 10.0481 9.95385 10.0481 10.0931 10.0481V12.5321V12.5327Z" fill="currentColor" />
                                                <path d="M15.0237 14.3711H11.3634C11.3575 14.2555 11.3477 14.1504 11.3477 14.0453C11.3464 12.7771 11.3464 11.5082 11.3477 10.2399C11.3483 9.32239 11.8494 8.81798 12.763 8.81404C13.1019 8.81272 13.4408 8.8055 13.7797 8.81601C14.5409 8.84031 15.0381 9.35194 15.0401 10.1151C15.044 11.4385 15.0414 12.7613 15.0401 14.0847C15.0401 14.1708 15.0309 14.2561 15.0237 14.3711Z" fill="currentColor" />
                                                <path d="M16.2832 12.5209V10.0481C16.8782 10.0481 17.4648 10.0462 18.0506 10.0488C18.356 10.0501 18.668 10.0251 18.9668 10.0744C19.619 10.1821 20.0433 10.7161 20.0164 11.3394C19.9901 11.9508 19.5389 12.4756 18.8985 12.5091C18.0394 12.5544 17.1764 12.5203 16.2839 12.5203L16.2832 12.5209Z" fill="currentColor" />
                                            </svg>

                                            <span>{item.bathrooms?.[i18n.language] || "—"}</span>

                                        </span>

                                        <span className={s.metaItem}>

                                            <svg className={s.metaIcon} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M4 16.5V3.5H3.75C3.33579 3.5 3 3.16421 3 2.75C3 2.33579 3.33579 2 3.75 2H16.25C16.6642 2 17 2.33579 17 2.75C17 3.16421 16.6642 3.5 16.25 3.5H16V16.5H16.25C16.6642 16.5 17 16.8358 17 17.25C17 17.6642 16.6642 18 16.25 18H12.75C12.3358 18 12 17.6642 12 17.25V14.75C12 14.3358 11.6642 14 11.25 14H8.75C8.33579 14 8 14.3358 8 14.75V17.25C8 17.6642 7.66421 18 7.25 18H3.75C3.33579 18 3 17.6642 3 17.25C3 16.8358 3.33579 16.5 3.75 16.5H4ZM7 5.5C7 5.22386 7.22386 5 7.5 5H8.5C8.77614 5 9 5.22386 9 5.5V6.5C9 6.77614 8.77614 7 8.5 7H7.5C7.22386 7 7 6.77614 7 6.5V5.5ZM7.5 9C7.22386 9 7 9.22386 7 9.5V10.5C7 10.7761 7.22386 11 7.5 11H8.5C8.77614 11 9 10.7761 9 10.5V9.5C9 9.22386 8.77614 9 8.5 9H7.5ZM11 5.5C11 5.22386 11.2239 5 11.5 5H12.5C12.7761 5 13 5.22386 13 5.5V6.5C13 6.77614 12.7761 7 12.5 7H11.5C11.2239 7 11 6.77614 11 6.5V5.5ZM11.5 9C11.2239 9 11 9.22386 11 9.5V10.5C11 10.7761 11.2239 11 11.5 11H12.5C12.7761 11 13 10.7761 13 10.5V9.5C13 9.22386 12.7761 9 12.5 9H11.5Z" fill="currentColor" />
                                            </svg>

                                            <span>{item.type?.[i18n.language] || "—"}</span>

                                        </span>

                                    </>

                                )}

                            </div>


                            <div className={s.descriptionWrap}>

                                <p
                                    ref={setDescRef(item.id)}
                                    className={`${s.description} ${expanded[item.id] ? s.expanded : ''}`}
                                >

                                    {item.description?.[i18n.language]}

                                </p>

                                {(overflowing[item.id] || expanded[item.id]) && (
                                    <button
                                        type="button"
                                        className={s.readMore}
                                        onClick={() => toggleExpanded(item.id)}
                                    >
                                        {expanded[item.id] ? labels.less : labels.more}
                                    </button>
                                )}

                            </div>


                            <div className={s.divider} />




                            <div className={s.bottom}>


                                <div className={s.prc}>


                                    <p>
                                        {t("price")}
                                    </p>


                                    <h3>

                                        {formatPriceIn(item.price, currency)}

                                    </h3>


                                </div>




                                <Link

                                    to={localizedPath(commercial ? `/commercial/${item.id}` : `/property/${item.id}`, i18n.language)}

                                    className={s.linkk}

                                >

                                    {t("viewProperty")}

                                    <svg className={s.linkkArrow} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14" />
                                        <path d="m13 6 6 6-6 6" />
                                    </svg>

                                </Link>


                            </div>




                            {isAdmin && (


                                <button

                                    className={s.btn}

                                    onClick={() =>
                                        commercial ? deleteCommercial(item.id) : deleteCard(item.id)
                                    }

                                >

                                    Delete

                                </button>


                            )}



                        </motion.div>



                    </SwiperSlide>


                ))}



            </Swiper>



        </section>

    )

}



export default Feautured