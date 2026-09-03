import s from './Value.module.css'
import { motion } from "framer-motion"
import { useTranslation } from 'react-i18next'

const Value = () => {

    const { t } = useTranslation()

    const value = [
        {
            id: 1,
            title: t("value.items.0.title"),
            description: t("value.items.0.description"),
            image: "/30ba0c66-7340-487e-be16-296b82609f4a.webp",
        },

        {
            id: 2,
            title: t("value.items.1.title"),
            description: t("value.items.1.description"),
            image: "/26650201-9eee-440b-87b0-be266e26b2b3.webp",
        },

        {
            id: 3,
            title: t("value.items.2.title"),
            description: t("value.items.2.description"),
            image: "/7b0a8b63-ece6-4cd5-98c7-7b4b5634ee00.webp",
        },

        {
            id: 4,
            title: t("value.items.3.title"),
            description: t("value.items.3.description"),
            image: "/e3825842-d81f-415f-84fe-41b05ff4ed4f.webp",
        },
    ];

    return (
        <section className={s.value} id='value'>

            <motion.div
                className={s.text}
                initial={{ opacity: 0, x: -80 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9 }}
                viewport={{ amount: 0.2 }}
            >

                <img
                    src="/Abstract Design.svg"
                    alt=""
                    className={s.logo}
                />

                <motion.h2
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    viewport={{ amount: 0.2 }}
                >
                    {t("value.title")}
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    viewport={{ amount: 0.2 }}
                >
                    {t("value.description")}
                </motion.p>

            </motion.div>

            <div className={s.cards}>

                {value.map((item, index) => (

                    <motion.div
                        key={item.id}
                        className={s.card}

                        initial={{
                            opacity: 0,
                            scale: 0.9,
                            y: 60
                        }}

                        whileInView={{
                            opacity: 1,
                            scale: 1,
                            y: 0
                        }}

                        transition={{
                            duration: 0.7,
                            delay: index * 0.15,
                            ease: [0.22, 1, 0.36, 1]
                        }}

                        viewport={{ amount: 0.2 }}

                        whileHover={{
                            y: -12,
                            scale: 1.02
                        }}
                    >

                        <div className={s.logo}>

                            <img
                                src={item.image}
                                alt={item.title}
                                className={s.image}
                            />

                            <h2>{item.title}</h2>

                        </div>

                        <p>{item.description}</p>

                    </motion.div>

                ))}

            </div>

        </section>
    )
}

export default Value