import { useTranslation } from "react-i18next";
import { MapPin, Tag, Flame } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { formatPriceIn } from "../utils/currency";

import s from "./CommercialHero.module.css";


const CommercialHero = ({ data }) => {


    const {
        i18n,
        t
    } = useTranslation();

    const { currency } = useCurrency();



    if (!data) return null;



    const lang = i18n.language;



    const text = (field) => {

        return (
            data[field]?.[lang] ||
            data[field]?.ru ||
            data[field]?.en ||
            data[field]?.uz ||
            "—"
        );

    };



    return (


        <section className={s.hero}>


            <div className={s.container}>


                <span className={s.dealBadge}>
                    {data.is_rent ? t("dealType.rent") : t("dealType.sale")}
                </span>


                <h1>

                    {text("title")}

                </h1>





                <p className={s.desc}>

                    {text("description")}

                </p>






                <div className={s.cards}>





                    <div className={s.card}>


                        <span>

                            {t("commercialPage.location")}

                        </span>



                        <h3>


                            <MapPin size={18} />



                            {text("location")}



                        </h3>



                    </div>









                    <div className={s.card}>


                        <span>

                            {t("commercialPage.type")}

                        </span>




                        <h3>


                            <Tag size={18} />



                            {text("class")}



                        </h3>




                    </div>









                    <div className={s.card}>


                        <span>

                            {t("commercialPage.price")}

                        </span>





                        <h3>


                            <Flame size={18} />



                            {formatPriceIn(data.price, currency)}


                        </h3>



                    </div>





                </div>





            </div>



        </section>


    )


}



export default CommercialHero;