import { useContext, useEffect } from "react";
import { MyContext } from "../Context";
import { localizedPath } from "../utils/lang";
import { useCurrency } from "../context/CurrencyContext";
import { formatPriceIn } from "../utils/currency";
import { useTranslation } from "react-i18next";

import { Swiper, SwiperSlide } from "swiper/react";
import {
    Navigation,
    Autoplay,
    Mousewheel
} from "swiper/modules";

import {
    Building2,
    Ruler,
    ArrowUp,
    Star,
    Tag
} from "lucide-react";


import { motion } from "framer-motion";


import "swiper/css";
import "swiper/css/navigation";

import s from "./CommercialSection.module.css";
import ListingCard from "./ListingCard";



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
                        latestCommercials.map(item => {

                            const title =
                                item.title?.[i18n.language] || item.title?.ru;

                            const meta = [
                                {
                                    icon: <Building2 size={15} />,
                                    label: `${item.floor} ${i18n.language === "ru" ? "этаж" : i18n.language === "uz" ? "qavat" : "floor"}`
                                },
                                {
                                    icon: <Ruler size={15} />,
                                    label: `${item.area} m²`
                                }
                            ];

                            if (item.ceiling_height) {
                                meta.push({
                                    icon: <ArrowUp size={15} />,
                                    label: `${item.ceiling_height} ${t("meters")}`
                                });
                            }

                            const tags = [];

                            if (item.class?.[i18n.language]) {
                                tags.push({ icon: <Tag size={13} />, label: item.class[i18n.language] });
                            }

                            if (item.landmark?.[i18n.language]) {
                                tags.push({ icon: <Star size={13} />, label: item.landmark[i18n.language] });
                            }

                            return (

                                <SwiperSlide key={item.id}>

                                    <ListingCard
                                        image={item.image}
                                        badge
                                        favoriteItem={{
                                            id: item.id,
                                            type: "commercial",
                                            title,
                                            image: item.image,
                                            price: item.price,
                                            link: localizedPath(`/commercial/${item.id}`, i18n.language)
                                        }}
                                        title={title}
                                        location={item.district?.[i18n.language] || item.district?.ru}
                                        meta={meta}
                                        tags={tags}
                                        description={
                                            item.description?.[i18n.language] ||
                                            item.description?.en ||
                                            item.description?.ru
                                        }
                                        price={formatPriceIn(item.price, currency)}
                                        detailsLink={localizedPath(`/commercial/${item.id}`, i18n.language)}
                                        detailsLabel={t("viewDetails")}
                                        isAdmin={isAdmin}
                                        onDelete={() => deleteCommercial(item.id)}
                                        editLink={`/admin/changeCommercial/${item.id}`}
                                        animation={{
                                            Component: motion.article,
                                            props: {
                                                initial: { opacity: 0, y: 60 },
                                                whileInView: { opacity: 1, y: 0 },
                                                transition: { duration: .5 }
                                            }
                                        }}
                                    />

                                </SwiperSlide>

                            );
                        })
                    }



                </Swiper>



            </div>


        </section>


    )

}


export default CommercialSection;
