import { useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MyContext } from "../Context";
import s from "./CreateVilla.module.css";


const CreateVilla = () => {


    const { id } = useParams();


    const {
        createVilla,
        uploadImage,
        properties,
        getCards
    } = useContext(MyContext);


    const [villa, setVilla] = useState({

        card_id: "",

        slug: "",


        title: {
            ru: "",
            en: "",
            uz: ""
        },

        description: {
            ru: "",
            en: "",
            uz: ""
        },
        about: {
            ru: "",
            en: "",
            uz: ""
        },

        location: {
            ru: "",
            en: "",
            uz: ""
        },

        type: {
            ru: "",
            en: "",
            uz: ""
        },

        price: "",

        bedrooms: "",
        year: "",
        square: "",

        images: [],

        amenities: []

    });

    useEffect(() => {

        getCards();

    }, []);




    const handleChange = (e, field, lang) => {


        setVilla(prev => ({


            ...prev,


            [field]: {

                ...prev[field],

                [lang]: e.target.value

            }


        }))


    };






    const handleImage = async (e) => {


        const file = e.target.files[0];


        if (!file) return;



        const url = await uploadImage(file);



        setVilla(prev => ({


            ...prev,


            images: [

                ...prev.images,

                url

            ]


        }));


    };





    const addAmenity = () => {


        setVilla(prev => ({


            ...prev,


            amenities: [

                ...prev.amenities,


                {
                    ru: "",
                    en: "",
                    uz: ""
                }


            ]


        }))


    }







    return (

        <section className={s.create}>


            <div className={s.container}>


                <h1 className={s.title}>
                    Create Villa
                </h1>

                <select

                    value={villa.card_id}

                    onChange={(e) =>

                        setVilla(prev => ({

                            ...prev,

                            card_id: e.target.value

                        }))

                    }

                >

                    <option value="">
                        Выберите карточку
                    </option>


                    {
                        properties.map(card => (

                            <option

                                key={card.id}

                                value={card.id}

                            >

                                {card.title.ru}

                            </option>

                        ))

                    }


                </select>



                <input

                    placeholder="Slug"

                    value={villa.slug}

                    onChange={(e) =>

                        setVilla(prev => ({

                            ...prev,

                            slug: e.target.value

                        }))

                    }


                />
                <input

                    placeholder="Card ID"

                    value={villa.card_id}

                    onChange={(e) =>

                        setVilla(prev => ({

                            ...prev,

                            card_id: e.target.value

                        }))

                    }

                />



                <h3>Название </h3>


                <input
                    placeholder="RU"
                    onChange={(e) =>
                        handleChange(e, "title", "ru")
                    }
                />

                <input
                    placeholder="EN"
                    onChange={(e) =>
                        handleChange(e, "title", "en")
                    }
                />

                <input
                    placeholder="UZ"
                    onChange={(e) =>
                        handleChange(e, "title", "uz")
                    }
                />






                <h3>Описание сверху </h3>


                <textarea
                    placeholder="RU"
                    onChange={(e) =>
                        handleChange(e, "description", "ru")
                    }
                />

                <textarea
                    placeholder="EN"
                    onChange={(e) =>
                        handleChange(e, "description", "en")
                    }
                />

                <textarea
                    placeholder="UZ"
                    onChange={(e) =>
                        handleChange(e, "description", "uz")
                    }
                />
                <h3>Информация о </h3>

                <textarea
                    placeholder="RU"
                    onChange={(e) =>
                        handleChange(e, "about", "ru")
                    }
                />

                <textarea
                    placeholder="EN"
                    onChange={(e) =>
                        handleChange(e, "about", "en")
                    }
                />

                <textarea
                    placeholder="UZ"
                    onChange={(e) =>
                        handleChange(e, "about", "uz")
                    }
                />







                <h3>Локация </h3>


                <input
                    placeholder="RU"
                    onChange={(e) =>
                        handleChange(e, "location", "ru")
                    }
                />

                <input
                    placeholder="EN"
                    onChange={(e) =>
                        handleChange(e, "location", "en")
                    }
                />

                <input
                    placeholder="UZ"
                    onChange={(e) =>
                        handleChange(e, "location", "uz")
                    }
                />







                <h3>Тип</h3>


                <input
                    placeholder="RU"
                    onChange={(e) =>
                        handleChange(e, "type", "ru")
                    }
                />

                <input
                    placeholder="EN"
                    onChange={(e) =>
                        handleChange(e, "type", "en")
                    }
                />

                <input
                    placeholder="UZ"
                    onChange={(e) =>
                        handleChange(e, "type", "uz")
                    }
                />







                <input
                    placeholder="Цена "
                    value={villa.price}

                    onChange={(e) =>

                        setVilla(prev => ({

                            ...prev,

                            price: e.target.value

                        }))

                    }
                />




                <input
                    placeholder="Комнаты "

                    value={villa.bedrooms}

                    onChange={(e) =>

                        setVilla(prev => ({

                            ...prev,

                            bedrooms: e.target.value

                        }))

                    }

                />
                <input
                    placeholder="Год"
                    value={villa.year}
                    onChange={(e) => setVilla(prev => ({
                        ...prev,
                        year: e.target.value
                    }))}
                />


                <input
                    placeholder="Площадь  m²"
                    value={villa.square}
                    onChange={(e) => setVilla(prev => ({
                        ...prev,
                        square: e.target.value
                    }))}
                />








                <h3>Фото </h3>


                <input

                    type="file"

                    onChange={handleImage}

                />



                <div className={s.preview}>


                    {
                        villa.images.map((img, index) => (

                            <div
                                className={s.imageBox}
                                key={index}
                            >

                                <img
                                    src={img}
                                    width="150"
                                />


                                <button
                                    type="button"

                                    onClick={() => {

                                        setVilla(prev => ({

                                            ...prev,

                                            images:
                                                prev.images.filter(
                                                    (_, i) => i !== index
                                                )

                                        }))

                                    }}
                                >

                                    ✕

                                </button>


                            </div>

                        ))
                    }


                </div>





                <h3>Преимущества </h3>


                <button
                    type="button"
                    onClick={addAmenity}
                >
                    Добавить Преимущества
                </button>



                <div className={s.amenitiesList}>


                    {
                        villa.amenities.map((a, i) => (


                            <div
                                className={s.amenity}
                                key={i}
                            >


                                <input

                                    placeholder="RU"

                                    value={a.ru}

                                    onChange={(e) => {


                                        const arr = [...villa.amenities];

                                        arr[i] = {
                                            ...arr[i],
                                            ru: e.target.value
                                        };


                                        setVilla(prev => ({

                                            ...prev,

                                            amenities: arr

                                        }))


                                    }}

                                />



                                <input

                                    placeholder="EN"

                                    value={a.en}

                                    onChange={(e) => {


                                        const arr = [...villa.amenities];

                                        arr[i] = {
                                            ...arr[i],
                                            en: e.target.value
                                        };


                                        setVilla(prev => ({

                                            ...prev,

                                            amenities: arr

                                        }))


                                    }}

                                />




                                <input

                                    placeholder="UZ"

                                    value={a.uz}

                                    onChange={(e) => {


                                        const arr = [...villa.amenities];

                                        arr[i] = {
                                            ...arr[i],
                                            uz: e.target.value
                                        };


                                        setVilla(prev => ({

                                            ...prev,

                                            amenities: arr

                                        }))


                                    }}

                                />



                                <button

                                    type="button"

                                    onClick={() => {


                                        setVilla(prev => ({


                                            ...prev,


                                            amenities:
                                                prev.amenities.filter(
                                                    (_, index) => index !== i
                                                )


                                        }))


                                    }}

                                >

                                    ✕

                                </button>



                            </div>


                        ))

                    }


                </div>


                <button

                    onClick={() => createVilla(villa)}

                >

                    Create Villa

                </button>




            </div>


        </section>

    )

}


export default CreateVilla;