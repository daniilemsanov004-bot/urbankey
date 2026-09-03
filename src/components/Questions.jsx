import s from './Questions.module.css'
import { motion } from "framer-motion"
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { useTranslation } from "react-i18next"

const Questions = () => {
    const { t } = useTranslation()

    const properties = [
        {
            id: 1,
            title: t("f.items.q1.title"),
            description: t("f.items.q1.desc"),
        },
        {
            id: 2,
            title: t("f.items.q2.title"),
            description: t("f.items.q2.desc"),
        },
        {
            id: 3,
            title: t("f.items.q3.title"),
            description: t("f.items.q3.desc"),
        },
        {
            id: 4,
            title: t("f.items.q4.title"),
            description: t("f.items.q4.desc"),
        },
        {
            id: 5,
            title: t("f.items.q5.title"),
            description: t("f.items.q5.desc"),
        },
        {
            id: 6,
            title: t("f.items.q6.title"),
            description: t("f.items.q6.desc"),
        },
        {
            id: 7,
            title: t("f.items.q7.title"),
            description: t("f.items.q7.desc"),
        },
      
    ]

    return (
        <section className={s.questions} id='questions'>

            <motion.div
                className={s.text}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
            >
                <img src="/Abstract Design.svg" alt="" className={s.logo} />

                <h2>{t("f.title")}</h2>

                <div className={s.titles}>
                    <p>{t("f.subtitle")}</p>
                </div>
            </motion.div>

            <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                slidesPerView={3}
                spaceBetween={30}
                navigation
                loop
                speed={900}
                autoplay={{
                    delay: 6000,
                    disableOnInteraction: false
                }}
                breakpoints={{
                    0: { slidesPerView: 1 },
                    768: { slidesPerView: 2 },
                    1200: { slidesPerView: 3 },
                }}
                className={s.swiper}
            >

                {properties.map((item, index) => (
                    <SwiperSlide key={item.id}>
                        <motion.div
                            className={s.card}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.6,
                                delay: index * 0.1
                            }}
                            viewport={{ once: true }}
                            whileHover={{ y: -10 }}
                        >
                            <h2>{item.title}</h2>
                            <p>{item.description}</p>
                        </motion.div>
                    </SwiperSlide>
                ))}

            </Swiper>

        </section>
    )
}

export default Questions