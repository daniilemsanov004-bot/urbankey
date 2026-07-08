import s from './Property.module.css'

import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { useCurrency } from "../context/CurrencyContext"
import { formatPriceIn } from "../utils/currency"

import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination, Autoplay } from "swiper/modules"

import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"

import { useState, useEffect, } from "react"





import GalleryModal from "./GalleryModal"

const Property = ({ data }) => {

    if (!data) return null;









    const {
        i18n,
        t
    } = useTranslation();

    const { currency } = useCurrency();



    const [open, setOpen] = useState(false);

    const [index, setIndex] = useState(0);









    const images = data.images || [];

    return (

        <section className={s.property}>


            <div className={s.all}>


                <motion.div

                    className={s.swiperWrapper}

                    initial={{
                        opacity: 0
                    }}

                    whileInView={{
                        opacity: 1
                    }}

                    transition={{
                        duration: 1
                    }}

                    viewport={{
                        once: true
                    }}

                >



                    <Swiper


                        modules={[
                            Navigation,
                            Pagination,
                            Autoplay
                        ]}


                        navigation


                        pagination={{
                            clickable: true
                        }}


                        loop={
                            images.length > 1
                        }


                        autoplay={{
                            delay: 3000,
                            disableOnInteraction: false
                        }}


                        className={s.mySwiper}



                    >



                        {
                            images.map((img, i) => (


                                <SwiperSlide

                                    key={i}

                                    className={s.slide}

                                >



                                    <img

                                        src={img}

                                        alt="villa"


                                        onClick={() => {

                                            setIndex(i)

                                            setOpen(true)

                                        }}


                                    />


                                </SwiperSlide>


                            ))
                        }



                    </Swiper>



                </motion.div>







                <motion.div

                    className={s.texts}


                    initial={{
                        opacity: 0
                    }}


                    whileInView={{
                        opacity: 1
                    }}


                    transition={{
                        duration: 1
                    }}


                    viewport={{
                        once: true
                    }}


                >





                    <h1>

                        {t("features")}

                    </h1>




                    <div className={s.rooms}>


                        <h2>
                            {data.bedrooms} {t("bedrooms")}
                        </h2>



                        <h2>
                            {data.type?.[i18n.language]}
                        </h2>


                    </div>







                    <div className={s.specifi}>


                        <h1>

                            {t("specifications")}

                        </h1>





                        <div className={s.cards}>


                            <div className={s.card}>


                                <h4>
                                    {t("bedrooms")}
                                </h4>


                                <h3>

                                    {data.bedrooms}

                                </h3>


                            </div>







                            <div className={s.card}>


                                <h4>

                                    {t("type")}

                                </h4>


                                <h3>

                                    {data.type?.[i18n.language]}

                                </h3>


                            </div>
                            <div className={s.card}>
                                <h4>{t("year")}</h4>
                                <h3>{data.year || "—"}</h3>
                            </div>


                            <div className={s.card}>
                                <h4>{t("square")}</h4>
                                <h3>
                                    {data.square || "—"} m²
                                </h3>
                            </div>







                            <div className={s.card}>


                                <h4>

                                    {t("price")}

                                </h4>


                                <h3>

                                    {formatPriceIn(data.price, currency)}

                                </h3>


                            </div>




                        </div>



                    </div>





                </motion.div>





            </div>









            <motion.div

                className={s.text}


                initial={{
                    opacity: 0,
                    y: 50
                }}


                whileInView={{
                    opacity: 1,
                    y: 0
                }}


                transition={{
                    duration: 1
                }}


                viewport={{
                    once: true
                }}


            >




                <h1>

                    {t("about")}

                </h1>



                <p>

                    {data.about?.[i18n.language]}

                </p>




            </motion.div>









            {
                open &&


                <GalleryModal


                    images={images}


                    activeIndex={index}


                    onClose={() => setOpen(false)}


                />

            }





        </section>

    )

}



export default Property