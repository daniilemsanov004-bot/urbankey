import { useParams, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";

import { MyContext } from "../Context";
import s from "./CreateCommercialPage.module.css";


const EditCommercialPage = () => {


    const { id } = useParams();

    const navigate = useNavigate();


    const {
        getCommercialPage,
        commercialPage,
        updateCommercialPage,
        uploadImage
    } = useContext(MyContext);



    const [page, setPage] = useState(null);




    useEffect(() => {

        if (id) {
            getCommercialPage(id);
        }

    }, [id]);





    useEffect(() => {

        if (commercialPage) {
            setPage(commercialPage);
        }

    }, [commercialPage]);






    const change = (e, field, lang) => {


        setPage(prev => ({


            ...prev,


            [field]: {

                ...(prev[field] || {}),

                [lang]: e.target.value

            }

        }))


    }





    const changeValue = (e, key) => {


        setPage(prev => ({


            ...prev,

            [key]: e.target.value

        }))

    }





    const save = async () => {


        const result = await updateCommercialPage(page);


        if (result) {

            navigate(`/commercial/${page.commercial_id}`);

        }

    }







    const uploadImages = async (e) => {


        const files = Array.from(e.target.files);


        const urls = [];



        for (const file of files) {


            const url = await uploadImage(file);


            if (url) {

                urls.push(url);

            }


        }




        setPage(prev => ({


            ...prev,


            images: [

                ...(prev.images || []),

                ...urls

            ]


        }));


    }







    const removeImage = (index) => {


        const arr = [...page.images];


        arr.splice(index, 1);



        setPage({

            ...page,

            images: arr

        });


    }







    const addAmenity = () => {


        setPage({

            ...page,

            amenities: [

                ...(page.amenities || []),

                ""

            ]

        })


    }






    const changeAmenity = (e, index) => {


        const arr = [...page.amenities];


        arr[index] = e.target.value;



        setPage({

            ...page,

            amenities: arr

        })


    }






    if (!page) {

        return <h1>Загрузка...</h1>

    }







    return (


        <section className={s.create}>


            <form

                className={s.container}

                onSubmit={(e) => e.preventDefault()}

            >




                <h1 className={s.title}>
                    Редактирование коммерции
                </h1>









                <h2>Название</h2>


                <input
                    placeholder="Название RU"
                    value={page.title?.ru || ""}
                    onChange={e => change(e, "title", "ru")}
                />


                <input
                    placeholder="Title EN"
                    value={page.title?.en || ""}
                    onChange={e => change(e, "title", "en")}
                />


                <input
                    placeholder="Nomi UZ"
                    value={page.title?.uz || ""}
                    onChange={e => change(e, "title", "uz")}
                />









                <h2>Описание</h2>


                <textarea
                    placeholder="Описание RU"
                    value={page.description?.ru || ""}
                    onChange={e => change(e, "description", "ru")}
                />


                <textarea
                    placeholder="Description EN"
                    value={page.description?.en || ""}
                    onChange={e => change(e, "description", "en")}
                />


                <textarea
                    placeholder="Tavsif UZ"
                    value={page.description?.uz || ""}
                    onChange={e => change(e, "description", "uz")}
                />









                <h2>Локация</h2>


                <input
                    placeholder="Локация RU"
                    value={page.location?.ru || ""}
                    onChange={e => change(e, "location", "ru")}
                />


                <input
                    placeholder="Location EN"
                    value={page.location?.en || ""}
                    onChange={e => change(e, "location", "en")}
                />


                <input
                    placeholder="Joylashuv UZ"
                    value={page.location?.uz || ""}
                    onChange={e => change(e, "location", "uz")}
                />









                <h2>Тип</h2>


                <input
                    placeholder="Тип RU"
                    value={page.type?.ru || ""}
                    onChange={e => change(e, "type", "ru")}
                />


                <input
                    placeholder="Type EN"
                    value={page.type?.en || ""}
                    onChange={e => change(e, "type", "en")}
                />


                <input
                    placeholder="Turi UZ"
                    value={page.type?.uz || ""}
                    onChange={e => change(e, "type", "uz")}
                />









                <h2>Класс</h2>


                <input
                    placeholder="Класс RU"
                    value={page.class?.ru || ""}
                    onChange={e => change(e, "class", "ru")}
                />


                <input
                    placeholder="Class EN"
                    value={page.class?.en || ""}
                    onChange={e => change(e, "class", "en")}
                />


                <input
                    placeholder="Klass UZ"
                    value={page.class?.uz || ""}
                    onChange={e => change(e, "class", "uz")}
                />









                <h2>Назначение</h2>


                <input
                    placeholder="Назначение RU"
                    value={page.purpose?.ru || ""}
                    onChange={e => change(e, "purpose", "ru")}
                />


                <input
                    placeholder="Purpose EN"
                    value={page.purpose?.en || ""}
                    onChange={e => change(e, "purpose", "en")}
                />


                <input
                    placeholder="Maqsad UZ"
                    value={page.purpose?.uz || ""}
                    onChange={e => change(e, "purpose", "uz")}
                />









                <h2>Характеристики</h2>



                <input
                    placeholder="Площадь"
                    value={page.area || ""}
                    onChange={e => changeValue(e, "area")}
                />



                <input
                    placeholder="Потолок"
                    value={page.ceiling_height || ""}
                    onChange={e => changeValue(e, "ceiling_height")}
                />



                <input
                    placeholder="Этаж"
                    value={page.floor || ""}
                    onChange={e => changeValue(e, "floor")}
                />



                <input
                    placeholder="Цена"
                    value={page.price || ""}
                    onChange={e => changeValue(e, "price")}
                />



                <input
                    placeholder="Ссылка на видео"
                    value={page.video || ""}
                    onChange={e => changeValue(e, "video")}
                />









                <h2>Картинки</h2>


                <input

                    type="file"

                    multiple

                    accept="image/*"

                    onChange={uploadImages}

                />




                <div>


                    {
                        page.images?.map((img, index) => (


                            <div key={index}>


                                <img

                                    src={img}

                                    width="150"

                                />



                                <button

                                    type="button"

                                    onClick={() => removeImage(index)}

                                >

                                    Удалить

                                </button>


                            </div>


                        ))

                    }


                </div>









                <h2>
                    Удобства
                </h2>


                {
                    (page.amenities || []).map((item, index) => (

                        <div key={index}>


                            <input

                                placeholder="Удобство RU"

                                value={item.ru || ""}

                                onChange={(e) => {


                                    const arr = [...page.amenities];


                                    arr[index] = {

                                        ...arr[index],

                                        ru: e.target.value

                                    };


                                    setPage({

                                        ...page,

                                        amenities: arr

                                    });


                                }}

                            />



                            <input

                                placeholder="Amenity EN"

                                value={item.en || ""}

                                onChange={(e) => {


                                    const arr = [...page.amenities];


                                    arr[index] = {

                                        ...arr[index],

                                        en: e.target.value

                                    };


                                    setPage({

                                        ...page,

                                        amenities: arr

                                    });


                                }}

                            />



                            <input

                                placeholder="Qulaylik UZ"

                                value={item.uz || ""}

                                onChange={(e) => {


                                    const arr = [...page.amenities];


                                    arr[index] = {

                                        ...arr[index],

                                        uz: e.target.value

                                    };


                                    setPage({

                                        ...page,

                                        amenities: arr

                                    });


                                }}

                            />



                            <button

                                type="button"

                                onClick={() => {


                                    const arr = [...page.amenities];


                                    arr.splice(index, 1);


                                    setPage({

                                        ...page,

                                        amenities: arr

                                    });


                                }}

                            >

                                Удалить

                            </button>



                        </div>

                    ))}




                <button

                    type="button"

                    onClick={() => {


                        setPage({

                            ...page,


                            amenities: [

                                ...(page.amenities || []),

                                {
                                    ru: "",
                                    en: "",
                                    uz: ""
                                }

                            ]


                        })


                    }}

                >

                    Добавить удобство

                </button>








                <button

                    type="button"

                    className={s.button}

                    onClick={save}

                >

                    Сохранить

                </button>





            </form>


        </section>


    )


}


export default EditCommercialPage;