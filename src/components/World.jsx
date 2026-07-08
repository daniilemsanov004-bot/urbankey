import s from './World.module.css'
import { motion } from "framer-motion"
import { useTranslation } from 'react-i18next'
import { Clock, Globe, UserCheck } from 'lucide-react'

const features = [
    { icon: Clock, key: 'experience' },
    { icon: Globe, key: 'languages' },
    { icon: UserCheck, key: 'support' },
]

const World = () => {

    const { t } = useTranslation()

    return (
        <section className={s.world} id='world'>

            <div className={s.images}>

                <motion.div
                    className={s.photoCol}

                    initial={{
                        opacity: 0,
                        x: -60
                    }}

                    whileInView={{
                        opacity: 1,
                        x: 0
                    }}

                    transition={{
                        duration: 0.7
                    }}

                    viewport={{
                        once: false,
                        amount: 0.2
                    }}
                >

                    <img
                        src="/preview.webp"
                        alt="Владислав Емшанов"
                        className={s.realtorImg}
                    />

                    <div className={s.photoCaption}>
                        <p className={s.name}>Владислав Емшанов</p>
                        <p className={s.role}>{t("world.role")}</p>
                    </div>

                </motion.div>

                <div className={s.contentCol}>

                    <motion.div
                        className={s.card}

                        initial={{
                            opacity: 0,
                            y: 40
                        }}

                        whileInView={{
                            opacity: 1,
                            y: 0
                        }}

                        transition={{
                            duration: 0.7,
                            delay: 0.1
                        }}

                        viewport={{
                            once: false,
                            amount: 0.2
                        }}
                    >

                        <img
                            src="/Abstract Design.svg"
                            alt=""
                            className={s.logo}
                        />

                        <h1>
                            {t("world.title")}
                        </h1>

                        <p>
                            {t("world.description")}
                        </p>

                    </motion.div>

                    <div className={s.divider} />

                    <div className={s.features}>

                        {features.map((f, i) => {
                            const Icon = f.icon

                            return (
                                <motion.div
                                    key={f.key}
                                    className={s.featureRow}

                                    initial={{
                                        opacity: 0,
                                        y: 20
                                    }}

                                    whileInView={{
                                        opacity: 1,
                                        y: 0
                                    }}

                                    transition={{
                                        duration: 0.6,
                                        delay: 0.2 + i * 0.1
                                    }}

                                    viewport={{
                                        once: false,
                                        amount: 0.2
                                    }}
                                >

                                    <div className={s.featureIcon}>
                                        <Icon size={17} strokeWidth={1.75} />
                                    </div>

                                    <div>
                                        <h3>
                                            {t(`world.features.${f.key}.title`)}
                                        </h3>

                                        <p>
                                            {t(`world.features.${f.key}.description`)}
                                        </p>
                                    </div>

                                </motion.div>
                            )
                        })}

                    </div>

                </div>

            </div>

        </section>
    )
}

export default World