import { useContext, useEffect, useState } from "react";
import { MyContext } from "../Context";
import s from "./ChangeVilla.module.css";


const ChangeVilla = () => {


    const {
        properties,
        getCards,
        getVilla,
        villa,
        setVilla,
        updateVilla,
        deleteVilla
    } = useContext(MyContext);



    const [selected, setSelected] = useState("");



    useEffect(() => {

        getCards();

    }, []);




    const changeField = (field, lang, value) => {

        setVilla(prev => ({

            ...prev,

            [field]: {

                ...prev[field],

                [lang]: value

            }

        }));

    };




    const loadVilla = (id) => {

        setSelected(id);

        getVilla(id);

    };






    if (!villa) {


        return (

            <section className={s.change}>


                <div className={s.container}>


                    <h1>
                        Выберите виллу
                    </h1>



                    <select

                        value={selected}

                        onChange={(e) => loadVilla(e.target.value)}

                    >

                        <option value="">
                            Villa
                        </option>


                        {
                            properties.map(item => (

                                <option

                                    key={item.id}

                                    value={item.id}

                                >

                                    {item.title.ru}

                                </option>

                            ))
                        }


                    </select>



                </div>


            </section>

        )

    }







    return (


        <section className={s.change}>


            <div className={s.container}>


                <h1>
                    Изменить {villa.title.ru}
                </h1>





                <div className={s.block}>


                    <h3>
                        Title
                    </h3>



                    {
                        ["ru", "en", "uz"].map(lang => (

                            <input

                                key={lang}

                                value={villa.title?.[lang] || ""}

                                placeholder={lang}

                                onChange={(e) =>
                                    changeField(
                                        "title",
                                        lang,
                                        e.target.value
                                    )
                                }

                            />

                        ))
                    }


                </div>









                <div className={s.block}>


                    <h3>
                        Description
                    </h3>



                    {
                        ["ru", "en", "uz"].map(lang => (

                            <textarea

                                key={lang}

                                value={
                                    villa.description?.[lang] || ""
                                }


                                placeholder={lang}

                                onChange={(e) =>
                                    changeField(
                                        "description",
                                        lang,
                                        e.target.value
                                    )
                                }

                            />


                        ))
                    }


                </div>









                <div className={s.block}>


                    <h3>
                        About
                    </h3>



                    {
                        ["ru", "en", "uz"].map(lang => (

                            <textarea

                                key={lang}

                                value={
                                    villa.about?.[lang] || ""
                                }

                                placeholder={lang}

                                onChange={(e) =>
                                    changeField(
                                        "about",
                                        lang,
                                        e.target.value
                                    )
                                }

                            />

                        ))
                    }



                </div>









                <div className={s.block}>


                    <h3>
                        Location
                    </h3>



                    {
                        ["ru", "en", "uz"].map(lang => (


                            <input

                                key={lang}

                                value={
                                    villa.location?.[lang] || ""
                                }


                                placeholder={lang}


                                onChange={(e) =>
                                    changeField(
                                        "location",
                                        lang,
                                        e.target.value
                                    )
                                }


                            />


                        ))

                    }



                </div>









                <div className={s.block}>


                    <h3>
                        Type
                    </h3>



                    {
                        ["ru", "en", "uz"].map(lang => (


                            <input

                                key={lang}

                                value={
                                    villa.type?.[lang] || ""
                                }


                                placeholder={lang}


                                onChange={(e) =>
                                    changeField(
                                        "type",
                                        lang,
                                        e.target.value
                                    )
                                }

                            />


                        ))

                    }



                </div>









                <div className={s.block}>


                    <input

                        placeholder="Price"

                        value={villa.price || ""}

                        onChange={(e) =>

                            setVilla(prev => ({

                                ...prev,

                                price: e.target.value

                            }))

                        }

                    />




                    <input

                        placeholder="Video URL"

                        value={villa.video || ""}

                        onChange={(e) =>

                            setVilla(prev => ({

                                ...prev,

                                video: e.target.value

                            }))

                        }

                    />




                    <input

                        placeholder="Bedrooms"

                        value={villa.bedrooms || ""}

                        onChange={(e) =>

                            setVilla(prev => ({

                                ...prev,

                                bedrooms: e.target.value

                            }))

                        }

                    />
                    <div className={s.block}>

                        <h3>
                            Details
                        </h3>


                        <input
                            placeholder="Year"
                            value={villa.year || ""}
                            onChange={(e) => setVilla(prev => ({
                                ...prev,
                                year: e.target.value
                            }))}
                        />


                        <input
                            placeholder="Square m²"
                            value={villa.square || ""}
                            onChange={(e) => setVilla(prev => ({
                                ...prev,
                                square: e.target.value
                            }))}
                        />


                    </div>


                </div>









                <div className={s.buttons}>


                    <button

                        className={s.back}

                        onClick={() => {

                            setVilla(null);

                            setSelected("");

                        }}

                    >

                        ← Выбрать другую виллу


                    </button>



                    <button
                        className={s.save}
                        onClick={() => {

                            updateVilla(villa, villa.id);

                        }}
                    >
                        Сохранить
                    </button>




                    <button

                        className={s.delete}

                        onClick={() => deleteVilla(villa.id)}

                    >

                        Удалить villa


                    </button>



                </div>





            </div>


        </section>


    )

}



export default ChangeVilla;