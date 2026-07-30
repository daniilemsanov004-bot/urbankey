import { useContext, useEffect, useState, useRef, useLayoutEffect } from "react";
import { MyContext } from "../Context";
import { useCurrency } from "../context/CurrencyContext";
import { formatPriceIn } from "../utils/currency";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Swiper, SwiperSlide } from "swiper/react";
import {
    Navigation,
    Autoplay,
    Mousewheel
} from "swiper/modules";

import {
    MapPin,
    Building2,
    Ruler,
    ArrowUp,
    Star,
    Tag,
    Flame
} from "lucide-react";


import { motion } from "framer-motion";


import "swiper/css";
import "swiper/css/navigation";

import s from "./CommercialSection.module.css";
import FavoriteButton from "./FavoriteButton";

const readMoreLabels = {
    ru: { more: "Подробнее", less: "Скрыть" },
    en: { more: "Show more", less: "Show less" },
    uz: { more: "Batafsil", less: "Yopish" },
};



const CommercialSection = () => {


    const {
        commercials,
        getCommercials,
        profile,
        deleteCommercial
    } = useContext(MyContext);


    const { i18n, t } = useTranslation();
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




    useEffect(() => {

        getCommercials();

    }, []);




    const latestCommercials =
        commercials.slice(0, 7);

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
    }, [latestCommercials, i18n.language]);


    const isAdmin = profile?.role === "admin";
    return (

        <section className={s.commercial}>


            <div className={s.container}>


                <h2 className={s.title}>
                    {t("commercial.title")}
                </h2>




                <Swiper

                    modules={[
                        Navigation,
                        Autoplay,
                        Mousewheel
                    ]}


                    navigation


                    loop={
                        latestCommercials.length > 3
                    }


                    grabCursor


                    mousewheel={{
                        forceToAxis: true,
                        sensitivity: .7
                    }}



                    autoplay={{
                        delay: 3500,
                        disableOnInteraction: false,
                        pauseOnMouseEnter: true
                    }}



                    speed={900}


                    spaceBetween={30}


                    breakpoints={{

                        0: {
                            slidesPerView: 1
                        },


                        650: {
                            slidesPerView: 1.2
                        },


                        900: {
                            slidesPerView: 2
                        },


                        1200: {
                            slidesPerView: 3
                        }

                    }}



                    className={s.slider}


                >



                    {
                        latestCommercials.map(item => (


                            <SwiperSlide key={item.id}>


                                <motion.article


                                    className={s.card}


                                    initial={{
                                        opacity: 0,
                                        y: 60
                                    }}


                                    whileInView={{
                                        opacity: 1,
                                        y: 0
                                    }}


                                    transition={{
                                        duration: .5
                                    }}


                                >



                                    <div className={s.imageBox}>


                                        <img
                                            src={item.image}
                                            className={s.image}
                                            alt=""
                                        />


                                        <div className={s.badge}>
                                            <Flame size={16} />
                                            Hot
                                        </div>

                                        <FavoriteButton
                                            item={{
                                                id: item.id,
                                                type: "commercial",
                                                title: item.title?.[i18n.language] || item.title?.ru,
                                                image: item.image,
                                                price: item.price,
                                                link: `/commercial/${item.id}`
                                            }}
                                            className={s.heart}
                                        />


                                    </div>






                                    <div className={s.content}>


                                        <h3>

                                            {
                                                item.title?.[i18n.language]
                                                ||
                                                item.title?.ru
                                            }

                                        </h3>




                                        <p className={s.location}>

                                            <MapPin size={17} />

                                            {
                                                item.district?.[i18n.language]
                                                ||
                                                item.district?.ru
                                            }

                                        </p>





                                        <p>

                                            {
                                                item.address?.[i18n.language]
                                                ||
                                                item.address?.ru
                                            }

                                        </p>







                                        <div className={s.meta}>


                                            <span className={s.metaItem}>

                                                <Building2 size={15} />

                                                {item.floor}

                                                {
                                                    i18n.language === "ru"
                                                        ? " этаж"
                                                        : i18n.language === "uz"
                                                            ? " qavat"
                                                            : " floor"
                                                }

                                            </span>



                                            <span className={s.metaItem}>

                                                <Ruler size={15} />

                                                {item.area} m²

                                            </span>




                                            {
                                                item.ceiling_height &&

                                                <span className={s.metaItem}>

                                                    <ArrowUp size={15} />

                                                    {item.ceiling_height} {t("meters")}

                                                </span>
                                            }


                                        </div>




                                        <div className={s.tags}>


                                            {
                                                item.class?.[i18n.language] &&

                                                <span>

                                                    <Tag size={13} />

                                                    {item.class[i18n.language]}

                                                </span>

                                            }



                                            {
                                                item.landmark?.[i18n.language] &&

                                                <span>

                                                    <Star size={13} />

                                                    {item.landmark[i18n.language]}

                                                </span>

                                            }


                                        </div>




                                        <div className={s.descriptionWrap}>

                                            <p
                                                ref={setDescRef(item.id)}
                                                className={`${s.desc} ${expanded[item.id] ? s.expanded : ''}`}
                                            >

                                                {
                                                    item.description?.[i18n.language]
                                                    ||
                                                    item.description?.en
                                                    ||
                                                    item.description?.ru
                                                }

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




                                        <div className={s.price}>


                                            {formatPriceIn(item.price, currency)}


                                            <Flame size={20} />


                                        </div>
                                        <Link
                                            to={`/commercial/${item.id}`}
                                            className={s.moreBtn}
                                        >
                                            {t("viewDetails")}

                                            <svg className={s.moreBtnArrow} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M5 12h14" />
                                                <path d="m13 6 6 6-6 6" />
                                            </svg>
                                        </Link>
                                        {
                                            isAdmin && (

                                                <div className={s.adminBtns}>


                                                    <button
                                                        className={s.delete}
                                                        onClick={() => deleteCommercial(item.id)}
                                                    >
                                                        🗑 {t("delete")}
                                                    </button>


                                                    <Link
                                                        to={`/admin/changeCommercial/${item.id}`}
                                                        className={s.edit}
                                                    >
                                                        ✏ {t("edit")}
                                                    </Link>


                                                </div>

                                            )
                                        }



                                    </div>




                                </motion.article>



                            </SwiperSlide>


                        ))
                    }



                </Swiper>



            </div>


        </section>


    )

}


export default CommercialSection;