import { useContext, useEffect } from "react";
import { MyContext } from "../Context";
import { Link } from "react-router-dom";
import s from "./ChangeCommercialPage.module.css";


const ChangeCommercialPage = () => {


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
                Изменение коммерции
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
                                    Изменить
                                </Link>





                                <button

                                    onClick={() => {

                                        if (confirm("Удалить?")) {
                                            deleteCommercialPage(item.id)
                                        }

                                    }}

                                >

                                    Удалить

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