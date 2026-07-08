import s from './Get.module.css'
import { motion } from "framer-motion"
import { useTranslation } from 'react-i18next'

const Get = () => {

    const { t } = useTranslation()

    return (
        <motion.section
            className={s.get}
            id='get'
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: false, amount: 0.2 }}
        >

            <div className={s.container}>

                <h1>
                    {t("getTitle")}
                </h1>

                <p>
                    {t("getDescription")}
                </p>

            </div>

        </motion.section>
    )
}

export default Get