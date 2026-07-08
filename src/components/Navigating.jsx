import s from './Navigating.module.css'
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"

const Navigating = () => {

    const { t } = useTranslation()

    const navigating = [
        {
            id: 1,
            step: t("step01"),
            title: t("navigatingCard1Title"),
            description: t("navigatingCard1Description"),
        },

        {
            id: 2,
            step: t("step02"),
            title: t("navigatingCard2Title"),
            description: t("navigatingCard2Description"),
        },

        {
            id: 3,
            step: t("step03"),
            title: t("navigatingCard3Title"),
            description: t("navigatingCard3Description"),
        },

        {
            id: 4,
            step: t("step04"),
            title: t("navigatingCard4Title"),
            description: t("navigatingCard4Description"),
        },

        {
            id: 5,
            step: t("step05"),
            title: t("navigatingCard5Title"),
            description: t("navigatingCard5Description"),
        },

        {
            id: 6,
            step: t("step06"),
            title: t("navigatingCard6Title"),
            description: t("navigatingCard6Description"),
        },
    ];

    return (
        <section className={s.navigating} id="navigating">

            <motion.div
                className={s.text}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ amount: 0.2 }}
            >

                <img
                    src="/Abstract Design.svg"
                    alt=""
                    className={s.logo}
                />

                <h1>{t("navigatingTitle")}</h1>

                <div className={s.titles}>
                    <p>
                        {t("navigatingDescription")}
                    </p>
                </div>

            </motion.div>

            <div className={s.cards}>

                {navigating.map((item, index) => (

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
                            delay: index * 0.12,
                            ease: [0.22, 1, 0.36, 1]
                        }}

                        viewport={{ amount: 0.2 }}

                        whileHover={{
                            y: -12,
                            scale: 1.02
                        }}
                    >

                        <h1>{item.step}</h1>

                        <div className={s.info}>
                            <h2>{item.title}</h2>
                            <p>{item.description}</p>
                        </div>

                    </motion.div>

                ))}

            </div>

        </section>
    )
}

export default Navigating