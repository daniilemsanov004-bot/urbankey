import { Link } from 'react-router-dom'
import s from './Featured.module.css'
import { motion } from "framer-motion"
import { useTranslation } from 'react-i18next'
import { useContext, useEffect } from "react";
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Autoplay, Mousewheel } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/navigation'

import { MyContext } from '../Context';
import { useCurrency } from '../context/CurrencyContext';
import { formatPriceIn } from '../utils/currency';
import FavoriteButton from './FavoriteButton';

const Feautured = () => {

    const {
        properties,
        getLatestCards,
        profile,
        deleteCard
    } = useContext(MyContext);

    useEffect(() => {
        getLatestCards();
    }, []);

    const { t, i18n } = useTranslation();
    const { currency } = useCurrency();
    const isAdmin = profile?.role === "admin";
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

                <h1>
                    {t("featured2Title")}
                </h1>

                <div className={s.titles}>

                    <p>
                        {t("featuredDescription")}
                    </p>

                    <Link
                        className={s.link}
                        to={"/Properties"}
                    >
                        {t("viewAll")}
                    </Link>

                </div>

            </div>

            <Swiper
                modules={[Navigation, Autoplay, Mousewheel]}
                spaceBetween={30}
                slidesPerView={3}
                loop={properties.length > 3}
                navigation={true}

                mousewheel={{
                    forceToAxis: true,
                }}

                autoplay={{
                    delay: 5500,
                    disableOnInteraction: false,
                }}

                breakpoints={{
                    0: {
                        slidesPerView: 1,
                    },

                    768: {
                        slidesPerView: 2,
                    },

                    1200: {
                        slidesPerView: 3,
                    }
                }}

                className={s.cards}
            >

                {properties.map((item) => (

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
                                    alt={item.title?.[i18n.language]}
                                    className={s.image}
                                    loading="lazy"
                                    decoding="async"
                                />

                                <FavoriteButton
                                    item={{
                                        id: item.id,
                                        type: "card",
                                        title: item.title?.[i18n.language],
                                        image: item.image,
                                        price: item.price,
                                        link: `/property/${item.id}`
                                    }}
                                />

                            </div>

                            <h2>
                                {item.title?.[i18n.language]}
                            </h2>

                            <p>
                                {item.description?.[i18n.language]}
                            </p>

                            <div className={s.info}>

                                <span>

                                    <img
                                        src="/BACKGROUND_2.svg"
                                        alt=""
                                    />

                                    {item.bedrooms?.[i18n.language] || "—"}

                                </span>

                                <span>
                                    <svg xmlns="http://www.w3.org/2000/svg"
                                        width="22"
                                        height="22"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#FFFFFF"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round">
                                        <path d="M4 22h16" />
                                        <path d="M7 22V4h10v18" />
                                        <path d="M10 8h1" />
                                        <path d="M13 8h1" />
                                        <path d="M10 12h1" />
                                        <path d="M13 12h1" />
                                        <path d="M10 16h1" />
                                        <path d="M13 16h1" />
                                    </svg>

                                    {item.bathrooms?.[i18n.language] || "—"}

                                </span>

                                <span>

                                    <img
                                        src="/Icon (1).svg"
                                        alt=""
                                    />

                                    {item.type?.[i18n.language] || "—"}

                                </span>

                            </div>

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
                                    to={`/property/${item.id}`}
                                    className={s.linkk}
                                >
                                    {t("viewProperty")}
                                </Link>

                            </div>

                            {isAdmin && (

                                <button
                                    className={s.btn}
                                    onClick={() => deleteCard(item.id)}
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