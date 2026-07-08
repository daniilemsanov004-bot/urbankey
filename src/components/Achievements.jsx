import s from './Achievements.module.scss'
import { motion } from "framer-motion"
import { useTranslation } from 'react-i18next'

const Achievements = () => {

    const { t } = useTranslation()

    const achievements = [
        {
            id: 1,
            title: t("achievement1Title"),
            description: t("achievement1Description"),
        },

        {
            id: 2,
            title: t("achievement2Title"),
            description: t("achievement2Description"),
        },

        {
            id: 3,
            title: t("achievement3Title"),
            description: t("achievement3Description"),
        },
    ];

    return (
        <section className={s.achievements} id='achievements'>

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

                <h1>{t("ourAchievements")}</h1>

                <div className={s.titles}>
                    <p>
                        {t("ourAchievementsDescription")}
                    </p>
                </div>

            </motion.div>

            <div className={s.cards}>

                {achievements.map((item, index) => (

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

                        <h2>{item.title}</h2>
                        <p>{item.description}</p>

                    </motion.div>

                ))}

            </div>

        </section>
    )
}

export default Achievements