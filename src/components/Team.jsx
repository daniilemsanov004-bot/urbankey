import s from './Team.module.css'
import { motion } from "framer-motion"
import { useTranslation } from 'react-i18next'

const Team = () => {

    const { t } = useTranslation()

    const team = [
        {
            id: 1,
            image: "/Image (3).webp",
            name: t("team.items.0.name"),
            work: t("team.items.0.work"),
            info: t("team.items.0.info"),
        },

        {
            id: 2,
            image: "/Image (4).webp",
            name: t("team.items.1.name"),
            work: t("team.items.1.work"),
            info: t("team.items.1.info"),
        },

        {
            id: 3,
            image: "/Image (5).webp",
            name: t("team.items.2.name"),
            work: t("team.items.2.work"),
            info: t("team.items.2.info"),
        },

        {
            id: 4,
            image: "/Image (6).webp",
            name: t("team.items.3.name"),
            work: t("team.items.3.work"),
            info: t("team.items.3.info"),
        },
    ];

    return (
        <section className={s.team} id='team'>

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

                <h1>{t("team.title")}</h1>

                <div className={s.titles}>
                    <p>
                        {t("team.subtitle")}
                    </p>
                </div>

            </motion.div>

            <div className={s.cards}>

                {team.map((item, index) => (

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

                        <img src={item.image} alt={item.name} />

                        <h2>{item.name}</h2>

                        <h3>{item.work}</h3>

                        <p>{item.info}</p>

                    </motion.div>

                ))}

            </div>

        </section>
    )
}

export default Team