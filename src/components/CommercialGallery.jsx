import { useState } from "react";
import { X } from "lucide-react";

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


                        <img src={active} />


                    </div>


                }



            </div>


        </section>

    )

}


export default CommercialGallery;