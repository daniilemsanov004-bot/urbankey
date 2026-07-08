import { useContext, useEffect } from "react";
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



const CommercialSection = () => {


    const {
        commercials,
        getCommercials,
        profile,
        deleteCommercial
    } = useContext(MyContext);


    const { i18n, t } = useTranslation();
    const { currency } = useCurrency();




    useEffect(() => {

        getCommercials();

    }, []);




    const latestCommercials =
        commercials.slice(0, 7);


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







                                        <div className={s.info}>


                                            <span>

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



                                            <span>

                                                <Ruler size={15} />

                                                {item.area}

                                            </span>





                                            {
                                                item.ceiling_height &&

                                                <span>

                                                    <ArrowUp size={15} />

                                                    {item.ceiling_height} {t("meters")}

                                                </span>
                                            }


                                        </div>







                                        <div className={s.more}>


                                            {
                                                item.class?.[i18n.language] &&

                                                <span>

                                                    <Tag size={14} />

                                                    {item.class[i18n.language]}

                                                </span>

                                            }



                                            {
                                                item.landmark?.[i18n.language] &&

                                                <span>

                                                    <Star size={14} />

                                                    {item.landmark[i18n.language]}

                                                </span>

                                            }


                                        </div>






                                        <p className={s.desc}>

                                            {
                                                item.description?.[i18n.language]
                                                ||
                                                item.description?.en
                                                ||
                                                item.description?.ru
                                            }

                                        </p>








                                        <div className={s.price}>


                                            {formatPriceIn(item.price, currency)}


                                            <Flame size={20} />


                                        </div>
                                        <Link
                                            to={`/commercial/${item.id}`}
                                            className={s.moreBtn}
                                        >
                                            {t("viewDetails")}
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