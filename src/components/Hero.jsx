import { Link } from 'react-router-dom'
import s from './Hero.module.css'
import { motion } from "framer-motion"
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const Hero = () => {

    const { t } = useTranslation()

    const [propertiesCount, setPropertiesCount] = useState(null)

    useEffect(() => {

        const fetchCount = async () => {

            const [cards, commercials] = await Promise.all([
                supabase.from("cardss").select("id", { count: "exact", head: true }),
                supabase.from("commercials").select("id", { count: "exact", head: true }),
            ])

            const total = (cards.count || 0) + (commercials.count || 0)

            if (total > 0) setPropertiesCount(total)
        }

        fetchCount()

    }, [])

    return (
        <section className={s.hero} id='HeroSection'>


            <video
                className={s.bgVideo}
                autoPlay
                muted
                loop
                playsInline
                preload="none"
            >
                <source src="/hero-bg.mp4" type="video/mp4" />
            </video>


            <div className={s.overlay}></div>


            <motion.div
                className={s.text}
                initial={{ opacity: 0, x: -80 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9 }}
                viewport={{ amount: 0.2 }}
            >

                <div className={s.titles}>

                    <motion.h1
                        className={s.titl}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        viewport={{ amount: 0.2 }}
                    >
                        {t("heroTitle1")}
                    </motion.h1>

                    <motion.h1
                        className={s.titl}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.15 }}
                        viewport={{ amount: 0.2 }}
                    >
                        {t("heroTitle2")}
                    </motion.h1>

                    <motion.h3
                        className={s.subtitle}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                        viewport={{ amount: 0.2 }}
                    >
                        {t("heroSubtitle")}
                    </motion.h3>

                </div>

                <motion.div
                    className={s.btns}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.45 }}
                    viewport={{ amount: 0.2 }}
                >

                    <Link className={s.link1} to={"/AboutUs"}>
                        {t("learnMore")}
                    </Link>

                    <Link className={s.link2} to={"/Properties"}>
                        {t("browseProperties")}
                    </Link>

                </motion.div>

                <div className={s.info}>

                    <motion.div
                        className={s.card}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ amount: 0.2 }}
                        whileHover={{ y: -10, scale: 1.03 }}
                    >
                        <h1>{propertiesCount ? `${propertiesCount}+` : "—"}</h1>
                        <p>{t("propertiesForClients")}</p>
                    </motion.div>

                    <motion.div
                        className={s.card}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        viewport={{ amount: 0.2 }}
                        whileHover={{ y: -10, scale: 1.03 }}
                    >
                        <h1>6+</h1>
                        <p>{t("yearsExperience")}</p>
                    </motion.div>

                    <motion.div
                        className={s.card}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        viewport={{ amount: 0.2 }}
                        whileHover={{ y: -10, scale: 1.03 }}
                    >
                        <h1>3</h1>
                        <p>{t("languagesSupported")}</p>
                    </motion.div>

                </div>

            </motion.div>
            <motion.img
                src="/public/c3383124-8cd3-4f72-9ab0-7fd2f40c9fcc.webp"
                alt=""
                className={s.imgg}

                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                whileInView={{ opacity: 1, x: 0, scale: 1 }}
                transition={{
                    duration: 1,
                    ease: [0.22, 1, 0.36, 1]
                }}
                viewport={{ amount: 0.2 }}

                whileHover={{
                    scale: 1.02
                }}
            />

        </section>
    )
}

export default Hero