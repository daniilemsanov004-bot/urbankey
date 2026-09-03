import { Link } from 'react-router-dom';
import { localizedPath } from '../utils/lang';
import s from './Unlock.module.css'
import { motion } from "framer-motion"
import { useTranslation } from 'react-i18next'

const Unlock = () => {

    const { t, i18n } = useTranslation()

    const unlock = [
        {
            id: 1,
            image: "/66d02a89-9abe-4eca-8a25-4513310d53d4.webp",
            name: t("unlock.items.0.name"),
            info: t("unlock.items.0.info"),
        },

        {
            id: 2,
            image: "/6bada091-d3f2-42c9-a414-d80d4c13fa46.webp",
            name: t("unlock.items.1.name"),
            info: t("unlock.items.1.info"),
        },

        {
            id: 3,
            image: "/bd4bea48-4739-46dd-b865-2a615f316b06.webp",
            name: t("unlock.items.2.name"),
            info: t("unlock.items.2.info"),
        },

        {
            id: 4,
            image: "/18d14da9-947f-47b2-a423-d0d190f48ec4.webp",
            name: t("unlock.items.3.name"),
            info: t("unlock.items.3.info"),
        },
    ];

    return (
        <section className={s.unlock} id='unlock'>

            <motion.div
                className={s.texts}

                initial={{
                    opacity: 0,
                    y: 40
                }}

                whileInView={{
                    opacity: 1,
                    y: 0
                }}

                transition={{
                    duration: 0.8
                }}

                viewport={{
                    once: true,
                    amount: 0.2
                }}
            >

                <img
                    src="/Abstract Design.svg"
                    alt=""
                    className={s.decor}
                />

                <h2>{t("unlock.title")}</h2>

                <p>
                    {t("unlock.description")}
                </p>

            </motion.div>

            <div className={s.cards}>

                {unlock.map((item, index) => (

                    <motion.div
                        key={item.id}
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
                            duration: 0.7,
                            delay: index * 0.12,
                            ease: [0.25, 0.46, 0.45, 0.94]
                        }}

                        viewport={{
                            once: true,
                            amount: 0.2
                        }}

                        whileHover={{
                            y: -8
                        }}
                    >

                        <motion.div
                            className={s.logo}

                            whileHover={{
                                x: 3
                            }}
                        >

                            <motion.img
                                src={item.image}
                                alt=""

                                whileHover={{
                                    scale: 1.08,
                                    rotate: 6
                                }}

                                transition={{
                                    duration: 0.3
                                }}
                            />

                            <h2>{item.name}</h2>

                        </motion.div>

                        <p>{item.info}</p>

                    </motion.div>

                ))}

                <motion.div
                    className={s.cardd}

                    initial={{
                        opacity: 0,
                        y: 80
                    }}

                    whileInView={{
                        opacity: 1,
                        y: 0
                    }}

                    transition={{
                        duration: 0.9,
                        ease: [0.25, 0.46, 0.45, 0.94]
                    }}

                    viewport={{
                        once: true,
                        amount: 0.2
                    }}

                    whileHover={{
                        y: -6
                    }}
                >

                    <div className={s.text}>

                        <motion.h1
                            initial={{
                                opacity: 0,
                                x: -30
                            }}

                            whileInView={{
                                opacity: 1,
                                x: 0
                            }}

                            transition={{
                                delay: 0.2,
                                duration: 0.7
                            }}
                        >
                            {t("unlock.cardTitle")}
                        </motion.h1>

                        <motion.div
                            whileHover={{
                                scale: 1.04
                            }}

                            whileTap={{
                                scale: 0.96
                            }}
                        >

                            <Link
                                to={localizedPath("/Properties", i18n.language)}
                                className={s.linkk}
                            >
                                {t("unlock.button")}
                            </Link>

                        </motion.div>

                    </div>

                    <motion.p
                        initial={{
                            opacity: 0
                        }}

                        whileInView={{
                            opacity: 1
                        }}

                        transition={{
                            delay: 0.4,
                            duration: 0.8
                        }}
                    >
                        {t("unlock.cardDescription")}
                    </motion.p>

                </motion.div>

            </div>
        </section>
    )
}

export default Unlock