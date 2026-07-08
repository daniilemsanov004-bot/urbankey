import s from './Clients.module.css'
import { motion } from "framer-motion"

import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

import { useTranslation } from 'react-i18next'

const Clients = () => {

    const { t } = useTranslation()

    const companies = [
        {
            id: 1,
            year: t("clientYear1"),
            title: "ABC Technologies",
            website: "https://abctechnologies.com",
            domain: t("clientDomain1"),
            category: t("clientCategory1"),
            review: t("clientReview1")
        },

        {
            id: 2,
            year: t("clientYear2"),
            title: "GreenTech Environmental",
            website: "https://greentechenv.com",
            domain: t("clientDomain2"),
            category: t("clientCategory2"),
            review: t("clientReview2")
        },

        {
            id: 3,
            year: t("clientYear3"),
            title: "Skyline Studio",
            website: "https://skyline.studio",
            domain: t("clientDomain3"),
            category: t("clientCategory3"),
            review: t("clientReview3")
        },

        {
            id: 4,
            year: t("clientYear4"),
            title: "VisionCraft",
            website: "https://visioncraft.com",
            domain: t("clientDomain4"),
            category: t("clientCategory4"),
            review: t("clientReview4")
        },

        {
            id: 5,
            year: t("clientYear5"),
            title: "NovaBuild",
            website: "https://novabuild.com",
            domain: t("clientDomain5"),
            category: t("clientCategory5"),
            review: t("clientReview5")
        }
    ]

    return (
        <section className={s.clients} id='clients'>

            <motion.div
                className={s.text}

                initial={{
                    opacity: 0,
                    y: 60
                }}

                whileInView={{
                    opacity: 1,
                    y: 0
                }}

                transition={{
                    duration: 0.9
                }}

                viewport={{
                    amount: 0.2
                }}
            >

                <img
                    src="/Abstract Design.svg"
                    alt=""
                    className={s.logo}
                />

                <motion.h1
                    initial={{
                        opacity: 0,
                        x: -60
                    }}

                    whileInView={{
                        opacity: 1,
                        x: 0
                    }}

                    transition={{
                        duration: 0.8
                    }}

                    viewport={{
                        amount: 0.2
                    }}
                >
                    {t("clientsTitle")}
                </motion.h1>

                <div className={s.titles}>

                    <motion.p
                        initial={{
                            opacity: 0,
                            x: -60
                        }}

                        whileInView={{
                            opacity: 1,
                            x: 0
                        }}

                        transition={{
                            duration: 0.8,
                            delay: 0.15
                        }}

                        viewport={{
                            amount: 0.2
                        }}
                    >
                        {t("clientsDescription")}
                    </motion.p>

                </div>

                <Swiper
                    modules={[Navigation, Pagination, Autoplay]}

                    slidesPerView={2}
                    spaceBetween={30}

                    navigation

                    loop={true}

                    autoplay={{
                        delay: 5000,
                        disableOnInteraction: false
                    }}

                    breakpoints={{
                        0: {
                            slidesPerView: 1,
                        },

                        1200: {
                            slidesPerView: 2,
                        },
                    }}

                    className={s.swiper}
                >

                    {companies.map((card, index) => (

                        <SwiperSlide key={card.id}>

                            <motion.div
                                className={s.card}

                                initial={{
                                    opacity: 0,
                                    rotateX: 40,
                                    y: 100,
                                    scale: 0.85
                                }}

                                whileInView={{
                                    opacity: 1,
                                    rotateX: 0,
                                    y: 0,
                                    scale: 1
                                }}

                                transition={{
                                    duration: 1,
                                    delay: index * 0.15,
                                    ease: [0.22, 1, 0.36, 1]
                                }}

                                viewport={{
                                    amount: 0.2
                                }}

                                whileHover={{
                                    y: -15,
                                    scale: 1.03,
                                    rotateY: 4,
                                    boxShadow: "0 20px 60px rgba(112,59,247,0.35)"
                                }}
                            >

                                <div className={s.top}>

                                    <div>
                                        <span>{card.year}</span>
                                        <h2>{card.title}</h2>
                                    </div>

                                    <motion.a
                                        className={s.button}
                                        href={card.website}
                                        target="_blank"
                                        rel="noopener noreferrer"

                                        whileHover={{
                                            scale: 1.08
                                        }}

                                        whileTap={{
                                            scale: 0.95
                                        }}
                                    >
                                        {t("visitWebsite")}
                                    </motion.a>

                                </div>

                                <div className={s.info}>

                                    <motion.div
                                        className={s.item}

                                        whileHover={{
                                            scale: 1.04
                                        }}
                                    >
                                        <h3>{t("domain")}</h3>
                                        <p>{card.domain}</p>
                                    </motion.div>

                                    <motion.div
                                        className={s.item}

                                        whileHover={{
                                            scale: 1.04
                                        }}
                                    >
                                        <h3>{t("category")}</h3>
                                        <p>{card.category}</p>
                                    </motion.div>

                                </div>

                                <motion.div
                                    className={s.review}

                                    initial={{
                                        opacity: 0
                                    }}

                                    whileInView={{
                                        opacity: 1
                                    }}

                                    transition={{
                                        duration: 1,
                                        delay: 0.4
                                    }}

                                    viewport={{
                                        amount: 0.2
                                    }}
                                >

                                    <h4>{t("whatTheySaid")}</h4>

                                    <p>{card.review}</p>

                                </motion.div>

                            </motion.div>

                        </SwiperSlide>

                    ))}

                </Swiper>

            </motion.div>

        </section>
    )
}

export default Clients