import s from './Amenities.module.css'
import Connect from './Connect_one'

import { motion } from "framer-motion"
import { useTranslation } from 'react-i18next'


const Amenities = ({ data }) => {

    const { i18n, t } = useTranslation();


    const amenities = data?.amenities?.length
        ? data.amenities
        : [
            {
                ru: t("amenityEighth1"),
                en: t("amenityEighth1"),
                uz: t("amenityEighth1")
            },
            {
                ru: t("amenityEighth2"),
                en: t("amenityEighth2"),
                uz: t("amenityEighth2")
            },
            {
                ru: t("amenityEighth3"),
                en: t("amenityEighth3"),
                uz: t("amenityEighth3")
            }
        ];



    return (

        <section className={s.amenities}>


            <h1>
                {t("amenitiesEighthTitle")}
            </h1>



            <div className={s.features}>


                {
                    amenities.map((item, index) => (


                        <motion.div

                            key={index}

                            className={s.feature}

                            initial={{
                                opacity: 0,
                                y: 30
                            }}

                            whileInView={{
                                opacity: 1,
                                y: 0
                            }}

                            viewport={{
                                once: true
                            }}

                        >

                            <span></span>


                            <h3>

                                {
                                    item?.[i18n.language]
                                }

                            </h3>


                        </motion.div>


                    ))
                }


            </div>



            <Connect />


        </section>

    )

}


export default Amenities