import { useContext, useEffect } from "react";
import { MyContext } from "../Context";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import s from "./ChangeCommercialPage.module.css";


const ChangeCommercialPage = () => {

    const { t } = useTranslation();

    const {
        commercialPages,
        getCommercialPages,
        deleteCommercialPage
    } = useContext(MyContext);



    useEffect(() => {

        getCommercialPages();

    }, []);




    return (

        <section className={s.page}>


            <h1>
                {t("changeCommercialPageTitle")}
            </h1>



            <div className={s.grid}>


                {
                    commercialPages?.map(item => (


                        <div
                            className={s.card}
                            key={item.id}
                        >


                            <img
                                src={item.images?.[0]}
                            />


                            <h2>

                                {item.title?.ru}

                            </h2>



                            <p>

                                {item.location?.ru}

                            </p>





                            <div className={s.buttons}>

                                <Link
                                    to={`/commercial/edit/${item.id}`}
                                >
                                    {t("edit")}
                                </Link>





                                <button

                                    onClick={() => {

                                        if (confirm(t("deleteCommercialConfirm"))) {
                                            deleteCommercialPage(item.id);
                                            toast.success(t("commercialDeleted"));
                                        }

                                    }}

                                >

                                    {t("delete")}

                                </button>



                            </div>



                        </div>


                    ))
                }


            </div>



        </section>


    )

}


export default ChangeCommercialPage;