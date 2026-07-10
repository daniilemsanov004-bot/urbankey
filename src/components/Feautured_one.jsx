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







    const list = items || (commercial ? commercials : properties);


    const similar = list
        .filter(item => item.id !== data?.id)
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


            return {
                ...item,
                score
            }

        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
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
                    {t("featuredTitle")}
                </h1>


                <div className={s.titles}>


                    <p>
                        {t("featuredText")}
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



                            <img

                                src={item.image}

                                alt={
                                    item.title?.[i18n.language]
                                }

                                className={s.image}

                                loading="lazy"

                                decoding="async"

                            />



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


                                    <img
                                        src="/Icon.svg"
                                        alt=""
                                    />


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

                                    to={commercial ? `/commercial/${item.id}` : item.link}

                                    className={s.linkk}

                                >

                                    {t("viewProperty")}

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