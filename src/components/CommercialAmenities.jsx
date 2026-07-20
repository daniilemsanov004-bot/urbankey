import s from "./CommercialAmenities.module.css";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";


const CommercialAmenities = ({ data }) => {


    const {
        i18n,
        t
    } = useTranslation();



    if (!data) return null;



    const amenities = data.amenities || [];

    if (!amenities.length) return null;



    const getText = (item) => {

        return (
            item?.[i18n.language] ||
            item?.ru ||
            item?.en ||
            item?.uz ||
            "—"
        );

    };



    return (


        <section className={s.amenities}>


            <h1>
                {t("amenitiesTitle")}
            </h1>





            <div className={s.features}>


                {
                    amenities.map((item,index)=>(


                        <motion.div


                            key={index}


                            className={s.feature}



                            initial={{
                                opacity:0,
                                y:40
                            }}



                            whileInView={{
                                opacity:1,
                                y:0
                            }}



                            viewport={{
                                once:true
                            }}



                        >



                            <span></span>




                            <h3>

                                {getText(item)}

                            </h3>




                        </motion.div>


                    ))
                }



            </div>



        </section>


    )


}



export default CommercialAmenities;