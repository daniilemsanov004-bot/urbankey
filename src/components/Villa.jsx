import s from './Villa.module.css'

import { motion } from "framer-motion"

import { useTranslation } from 'react-i18next'
import { useCurrency } from '../context/CurrencyContext'
import { formatPriceIn } from '../utils/currency'



const Villa = ({ data }) => {


    const { i18n, t } = useTranslation();
    const { currency } = useCurrency();



    if (!data) return null;




    return (

        <section className={s.villaBg}>


            <motion.div

                className={s.villa}


                initial={{
                    opacity: 0,
                    y: 100,
                    filter: "blur(10px)"
                }}


                whileInView={{
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)"
                }}


                transition={{
                    duration: 1,
                    ease: [0.22, 1, 0.36, 1]
                }}


                viewport={{
                    once: true,
                    amount: .2
                }}

            >




                <motion.h1>


                    {data.title?.[i18n.language]}


                </motion.h1>





                <motion.p>


                    {data.description?.[i18n.language]}


                </motion.p>







                <div className={s.info}>


                    <motion.div

                        className={s.box}

                        whileHover={{
                            y: -10,
                            scale: 1.03
                        }}

                    >


                        <h4>


                            <span>

                                {t("location")}:

                            </span>



                            {data.location?.[i18n.language] || "—"}



                        </h4>



                    </motion.div>









                    <motion.div

                        className={s.box}

                        whileHover={{
                            y: -10,
                            scale: 1.03
                        }}

                    >


                        <h5>


                            <span>

                                {t("type")}:

                            </span>



                            {data.type?.[i18n.language] || "—"}



                        </h5>



                    </motion.div>









                    <motion.div

                        className={s.box}

                        whileHover={{
                            y: -10,
                            scale: 1.03
                        }}

                    >



                        <h3>


                            <span className={s.prc}>


                                {t("price")}:


                            </span>



                            {formatPriceIn(data.price, currency)}



                        </h3>




                    </motion.div>





                </div>





            </motion.div>




        </section>

    )

}



export default Villa