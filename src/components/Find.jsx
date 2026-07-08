import s from './Find.module.css'
import { motion } from "framer-motion"
import { useTranslation } from 'react-i18next'

const Find = () => {

    const { t } = useTranslation()

    return (
        <motion.section
            className={s.find}
            id='find'
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: false, amount: 0.2 }}
        >

            <div className={s.container}>

                <h1>
                    {t("findTitle")}
                </h1>

                <p>
                    {t("findDescription")}
                </p>

            </div>

        </motion.section>
    )
}

export default Find