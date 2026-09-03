import { Link } from 'react-router-dom'
import s from './Smart.module.css'
import { motion } from "framer-motion"
import { localizedPath } from "../utils/lang"
import { useTranslation } from "react-i18next"

const Smart = () => {
    const { t, i18n } = useTranslation()

    const smart = [
        {
            id: 1,
            title: t("smart.items.0.title"),
            description: t("smart.items.0.desc"),
            image: "/66d02a89-9abe-4eca-8a25-4513310d53d4.webp",
        },
        {
            id: 2,
            title: t("smart.items.1.title"),
            description: t("smart.items.1.desc"),
            image: "/c1411a50-7fc4-469a-b74c-5af78e637046.webp",
        },
        {
            id: 3,
            title: t("smart.items.2.title"),
            description: t("smart.items.2.desc"),
            image: "/f25ef2fe-8301-4ce0-a1a0-33c96d9848f0.webp",
        },
        {
            id: 4,
            title: t("smart.items.3.title"),
            description: t("smart.items.3.desc"),
            image: "/29177091-5241-415b-856b-03b3440f3065.webp",
        },
    ]

    return (
        <section className={s.smart} id='smart'>

            <motion.div className={s.text}>
                <motion.img
                    src="/Abstract Design.svg"
                    alt=""
                    className={s.logo}
                />

                <motion.h2>
                    {t("smart.title")}
                </motion.h2>

                <motion.p>
                    {t("smart.subtitle")}
                </motion.p>

                <motion.div className={s.cardd}>
                    <h2>{t("smart.cta.title")}</h2>

                    <p>{t("smart.cta.desc")}</p>

                    <Link className={s.linkk} to={localizedPath("/ContactUs", i18n.language)}>
                        {t("smart.cta.button")}
                    </Link>
                </motion.div>
            </motion.div>

            <motion.div className={s.cards}>

                {smart.map((item, index) => (
                    <motion.div key={item.id} className={s.card}>
                        <motion.div className={s.logo}>
                            <motion.img
                                src={item.image}
                                alt={item.title}
                                className={s.image}
                            />
                            <h2>{item.title}</h2>
                        </motion.div>

                        <p>{item.description}</p>
                    </motion.div>
                ))}

            </motion.div>

        </section>
    )
}

export default Smart