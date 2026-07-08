import s from './Elevate.module.css'
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"

const Elevate = () => {

    const { t } = useTranslation()

    return (
        <motion.section
            className={s.elevate}
            id='elevate'
            initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: false, amount: 0.2 }}
        >
            <div className={s.container}>

                <h1>
                    {t("elevateTitle")}
                </h1>

                <p>
                    {t("elevateText")}
                </p>

            </div>
        </motion.section>
    )
}

export default Elevate