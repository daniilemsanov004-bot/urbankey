import { useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import s from "./CommercialGallery.module.css";


const CommercialGallery = ({ data }) => {


    const [active, setActive] = useState(null);



    return (

        <section className={s.gallery}>


            <div className={s.container}>


                <div className={s.grid}>


                    {
                        (data.images || [data.image]).map((img, i) => (


                            <img

                                key={i}

                                src={img}

                                onClick={() => setActive(img)}

                                className={s.img}

                                alt={`${title} — ${t("photo")} ${i + 1}`}

                                loading="lazy"

                                decoding="async"

                            />


                        ))

                    }


                </div>



                {
                    active &&

                    <div
                        className={s.modal}
                        onClick={() => setActive(null)}
                    >


                        <button>

                            <X />

                        </button>


                        <img src={active} alt={title} />


                    </div>


                }



            </div>


        </section>

    )

}


export default CommercialGallery;