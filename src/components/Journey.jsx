import s from './Journey.module.css'
import { motion } from "framer-motion"
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const Journey = () => {

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
        <section className={s.journey} id='journey'>

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

                <motion.h1
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    viewport={{ amount: 0.2 }}
                >
                    {t("journeyTitle")}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    viewport={{ amount: 0.2 }}
                >
                    {t("journeyDescription")}
                </motion.p>

                <div className={s.info}>

                    <motion.div
                        className={s.card}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ amount: 0.2 }}
                        whileHover={{ y: -10, scale: 1.03 }}
                    >
                        <p className={s.statValue}>{propertiesCount ? `${propertiesCount}+` : "—"}</p>
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
                        <p className={s.statValue}>6+</p>
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
                        <p className={s.statValue}>3</p>
                        <p>{t("languagesSupported")}</p>
                    </motion.div>

                </div>

            </motion.div>

            <motion.img
                src="/2673013c-add2-4fa9-aaae-ab6071e3b2f3.webp"
                alt=""
                className={s.urbankeyimage}

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

export default Journey