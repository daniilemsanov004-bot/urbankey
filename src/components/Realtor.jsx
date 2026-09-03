import s from './Realtor.module.css'
import { motion } from "framer-motion"
import { useTranslation } from 'react-i18next'
import { ShieldCheck, Handshake, Camera, Tag, ClipboardCheck, UserCog, Phone, MessageCircle } from 'lucide-react'
import {
    RiInstagramFill,
    RiTelegram2Fill,
} from "react-icons/ri";

const Realtor = () => {

    const { t } = useTranslation()

    const phoneNumber = "+998 90 974 62 56"
    const phoneHref = "+998909746256"

    const points = [
        {
            id: 1,
            icon: <ShieldCheck size={22} />,
            title: t("realtor.points.0.title"),
            description: t("realtor.points.0.description"),
        },
        {
            id: 2,
            icon: <Handshake size={22} />,
            title: t("realtor.points.1.title"),
            description: t("realtor.points.1.description"),
        },
        {
            id: 3,
            icon: <Camera size={22} />,
            title: t("realtor.points.2.title"),
            description: t("realtor.points.2.description"),
        },
        {
            id: 4,
            icon: <Tag size={22} />,
            title: t("realtor.points.3.title"),
            description: t("realtor.points.3.description"),
        },
        {
            id: 5,
            icon: <ClipboardCheck size={22} />,
            title: t("realtor.points.4.title"),
            description: t("realtor.points.4.description"),
        },
        {
            id: 6,
            icon: <UserCog size={22} />,
            title: t("realtor.points.5.title"),
            description: t("realtor.points.5.description"),
        },
    ]

    return (
        <section className={s.realtor} id='realtor'>

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

                <h2>{t("realtor.title")}</h2>

                <div className={s.titles}>
                    <p>
                        {t("realtor.subtitle")}
                    </p>
                </div>

            </motion.div>

            <div className={s.content}>

                <motion.div
                    className={s.photoWrap}
                    initial={{ opacity: 0, x: -60, scale: 0.95 }}
                    whileInView={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    viewport={{ amount: 0.2 }}
                >
                    <img src="/realtor.webp" alt={t("realtor.name")} className={s.photo} />

                    <div className={s.badge}>
                        <span>{t("realtor.experienceBadge")}</span>
                    </div>
                </motion.div>

                <motion.div
                    className={s.info}
                    initial={{ opacity: 0, x: 60 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    viewport={{ amount: 0.2 }}
                >

                    <h2>{t("realtor.name")}</h2>
                    <h3>{t("realtor.role")}</h3>

                    <div className={s.points}>

                        {points.map((point, index) => (

                            <motion.div
                                key={point.id}
                                className={s.point}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.08 }}
                                viewport={{ amount: 0.2 }}
                            >
                                <div className={s.icon}>
                                    {point.icon}
                                </div>

                                <div>
                                    <h4>{point.title}</h4>
                                    <p>{point.description}</p>
                                </div>

                            </motion.div>

                        ))}

                    </div>

                    <div className={s.actions}>

                        <motion.a
                            className={s.callButton}
                            href={`tel:${phoneHref}`}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                        >
                            <Phone size={18} />
                            {phoneNumber}
                        </motion.a>

                        <motion.a
                            className={s.waButton}
                            href={`https://wa.me/${phoneHref.replace('+', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                        >
                            <MessageCircle size={18} />
                            WhatsApp
                        </motion.a>

                        <motion.a
                            className={s.instagramButton}
                            href="https://www.instagram.com/vladislav_broker?fbclid=IwY2xjawS4YElleHRuA2FlbQIxMABicmlkETFZSThpZEFFZkhqODR3TnZ5c3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHrxU4SvIHrMEGgNNjYrBEKhEkP6ieJLCeqn2AA_4Pw7uBdCQ_1v4xF6osa_b_aem_eTaWAOI-mWKewTsM4ZEdoQ"
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                        >
                            <RiInstagramFill size={18} />
                            Instagram
                        </motion.a>
                        <motion.a
                            className={s.telegramButton}
                            href="https://t.me/VladislaVBroker"
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                        >
                            <RiTelegram2Fill size={18} />
                            Telegram
                        </motion.a>
                    </div>



                </motion.div>

            </div>

        </section>
    )
}

export default Realtor
