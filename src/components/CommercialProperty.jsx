import s from "./CommercialProperty.module.css";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../context/CurrencyContext";
import { formatPriceIn } from "../utils/currency";

import {
    Swiper,
    SwiperSlide
} from "swiper/react";

import {
    Navigation,
    Pagination,
    Autoplay
} from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { useState } from "react";

import GalleryModal from "./GalleryModal";


const CommercialProperty = ({ data }) => {


    const {
        i18n,
        t
    } = useTranslation();

    const { currency } = useCurrency();



    const [open, setOpen] = useState(false);
    const [index, setIndex] = useState(0);



    if (!data) return null;



    const lang = i18n.language;


    const text = (field) => {

        return (
            data[field]?.[lang] ||
            data[field]?.ru ||
            data[field]?.en ||
            data[field]?.uz ||
            "—"
        );

    };



    const images = data.images || [];
    const videos = data.videos || [];

    const media = [
        ...images.map((src) => ({ src, type: "image" })),
        ...videos.map((src) => ({ src, type: "video" }))
    ];



    return (


        <section className={s.property}>


            <div className={s.all}>


                {/* LEFT */}


                <motion.div
                    className={s.swiperWrapper}

                    initial={{
                        opacity: 0
                    }}

                    animate={{
                        opacity: 1
                    }}

                    transition={{
                        duration: 1
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
                            media.length > 1
                        }

                        autoplay={
                            media.some((m) => m.type === "video")
                                ? false
                                : { delay: 3000, disableOnInteraction: false }
                        }

                        observer
                        observeParents
                        onSwiper={(swiper) => {
                            requestAnimationFrame(() => swiper.update());
                        }}

                        observer
                        observeParents
                        onSwiper={(swiper) => {
                            requestAnimationFrame(() => swiper.update());
                        }}

                        className={s.mySwiper}

                    >


                        {
                            media.map((item, i) => (


                                <SwiperSlide
                                    key={i}
                                    className={s.slide}
                                >


                                    {item.type === "video" ? (
                                        <video
                                            src={item.src}
                                            controls
                                            playsInline
                                            onClick={() => {

                                                setIndex(i);
                                                setOpen(true);

                                            }}
                                        />
                                    ) : (
                                        <img
                                            src={item.src}
                                            alt=""
                                            onClick={() => {

                                                setIndex(i);
                                                setOpen(true);

                                            }}
                                        />
                                    )}


                                </SwiperSlide>


                            ))
                        }


                    </Swiper>



                </motion.div>






                {/* RIGHT */}



                <motion.div
                    className={s.texts}

                    initial={{
                        opacity: 0
                    }}

                    animate={{
                        opacity: 1
                    }}
                >




                    <h1>
                        {t("features")}
                    </h1>




                    <div className={s.rooms}>


                        <h2>

                            {data.floor || "—"}

                            {" "}

                            {t("floor")}

                        </h2>



                        <h2>

                            {text("class")}

                        </h2>



                    </div>






                    <div className={s.specifi}>


                        <h1>
                            {t("specifications")}
                        </h1>



                        <div className={s.cards}>



                            <div className={s.card}>

                                <h4>
                                    {t("area")}
                                </h4>

                                <h3>
                                    {data.area || "—"} m²
                                </h3>

                            </div>





                            <div className={s.card}>

                                <h4>
                                    {t("ceiling")}
                                </h4>

                                <h3>
                                    {data.ceiling_height || "—"} m
                                </h3>

                            </div>






                            <div className={s.card}>

                                <h4>
                                    {t("type")}
                                </h4>

                                <h3>

                                    {text("type")}

                                </h3>

                            </div>







                            <div className={s.card}>

                                <h4>
                                    {t("purpose")}
                                </h4>

                                <h3>

                                    {text("purpose")}

                                </h3>


                            </div>







                            <div className={s.card}>

                                <h4>
                                    {t("price")}
                                </h4>


                                <h3>

                                    {formatPriceIn(data.price, currency) || "—"}

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

            >



                <h1>
                    {t("about")}
                </h1>



                <p>

                    {text("description")}

                </p>




            </motion.div>







            {
                open &&


                <GalleryModal

                    media={media}

                    activeIndex={index}

                    onClose={() => setOpen(false)}

                />


            }




        </section>


    )


}



export default CommercialProperty;