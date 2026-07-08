import { useState, useContext, useEffect } from "react";
import { MyContext } from "../Context";
import { useNavigate } from "react-router-dom";
import s from "./CreateCommercialPage.module.css";

const CreateCommercialPage = () => {
    const navigate = useNavigate();

    const {
        commercials,
        getCommercials,
        createCommercialPage,
        uploadImage
    } = useContext(MyContext);

    const [page, setPage] = useState({
        commercial_id: "",
        slug: "",

        title: { ru: "", en: "", uz: "" },
        description: { ru: "", en: "", uz: "" },
        about: { ru: "", en: "", uz: "" },
        location: { ru: "", en: "", uz: "" },

        type: { ru: "", en: "", uz: "" },
        class: { ru: "", en: "", uz: "" },
        purpose: { ru: "", en: "", uz: "" },

        area: "",
        ceiling_height: "",
        floor: "",
        price: "",

        images: [],
        amenities: []
    });

    useEffect(() => {
        getCommercials();
    }, []);

    // 🔥 универсальный хендлер для multilingual полей
    const handleLangChange = (field, lang, value) => {
        setPage(prev => ({
            ...prev,
            [field]: {
                ...prev[field],
                [lang]: value
            }
        }));
    };

    const handleChange = (field, value) => {
        setPage(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const upload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const url = await uploadImage(file);

        setPage(prev => ({
            ...prev,
            images: [...prev.images, url]
        }));
    };

    const addAmenity = () => {
        setPage(prev => ({
            ...prev,
            amenities: [
                ...prev.amenities,
                { ru: "", en: "", uz: "" }
            ]
        }));
    };

    const updateAmenity = (index, lang, value) => {
        const arr = [...page.amenities];
        arr[index][lang] = value;

        setPage(prev => ({
            ...prev,
            amenities: arr
        }));
    };

    const submit = async (e) => {
        e.preventDefault();
        await createCommercialPage(page);
        navigate("/admin");
    };

    return (
        <section className={s.create}>
            <form className={s.container} onSubmit={submit}>

                <h1 className={s.title}>Создание страницы коммерции</h1>

                {/* SELECT */}
                <select
                    value={page.commercial_id}
                    onChange={(e) => handleChange("commercial_id", e.target.value)}
                >
                    <option value="">Выберите объект</option>
                    {commercials.map(item => (
                        <option key={item.id} value={item.id}>
                            {item.title.ru}
                        </option>
                    ))}
                </select>

                {/* SLUG */}
                <input
                    placeholder="Slug"
                    value={page.slug}
                    onChange={(e) => handleChange("slug", e.target.value)}
                />

                {/* TITLE */}
                <h3>Название</h3>
                <div className={s.inputs}>
                    {["ru", "en", "uz"].map(lang => (
                        <input
                            key={lang}
                            placeholder={lang}
                            value={page.title[lang]}
                            onChange={(e) =>
                                handleLangChange("title", lang, e.target.value)
                            }
                        />
                    ))}
                </div>

                {/* TYPE */}
                <h3>Тип</h3>
                {["ru", "en", "uz"].map(lang => (
                    <input
                        key={lang}
                        placeholder={lang}
                        value={page.type[lang]}
                        onChange={(e) =>
                            handleLangChange("type", lang, e.target.value)
                        }
                    />
                ))}

                {/* CLASS */}
                <h3>Класс</h3>
                {["ru", "en", "uz"].map(lang => (
                    <input
                        key={lang}
                        placeholder={lang}
                        value={page.class[lang]}
                        onChange={(e) =>
                            handleLangChange("class", lang, e.target.value)
                        }
                    />
                ))}

                {/* PURPOSE */}
                <h3>Назначение</h3>
                {["ru", "en", "uz"].map(lang => (
                    <input
                        key={lang}
                        placeholder={lang}
                        value={page.purpose[lang]}
                        onChange={(e) =>
                            handleLangChange("purpose", lang, e.target.value)
                        }
                    />
                ))}

                {/* NUMBERS */}
                <h3>Параметры</h3>
                <input
                    type="number"
                    placeholder="Площадь"
                    value={page.area}
                    onChange={e =>
                        setPage(p => ({
                            ...p,
                            area: e.target.value
                        }))
                    }
                />

                <input
                    type="number"
                    placeholder="Высота потолков"
                    value={page.ceiling_height}
                    onChange={e =>
                        setPage(p => ({
                            ...p,
                            ceiling_height: e.target.value
                        }))
                    }
                />


                <input
                    type="number"
                    placeholder="Этаж"
                    value={page.floor}
                    onChange={e =>
                        setPage(p => ({
                            ...p,
                            floor: e.target.value
                        }))
                    }
                />

                <input
                    type="number"
                    placeholder="Цена"
                    value={page.price}
                    onChange={e =>
                        setPage(p => ({
                            ...p,
                            price: e.target.value
                        }))
                    }
                />

                {/* DESCRIPTION */}
                <h3>Описание</h3>
                {["ru", "en", "uz"].map(lang => (
                    <textarea
                        key={lang}
                        placeholder={lang}
                        value={page.description[lang]}
                        onChange={(e) =>
                            handleLangChange("description", lang, e.target.value)
                        }
                    />
                ))}

                {/* ABOUT */}
                <h3>О компании</h3>
                {["ru", "en", "uz"].map(lang => (
                    <textarea
                        key={lang}
                        placeholder={lang}
                        value={page.about[lang]}
                        onChange={(e) =>
                            handleLangChange("about", lang, e.target.value)
                        }
                    />
                ))}

                {/* LOCATION */}
                <h3>Локация</h3>
                {["ru", "en", "uz"].map(lang => (
                    <input
                        key={lang}
                        placeholder={lang}
                        value={page.location[lang]}
                        onChange={(e) =>
                            handleLangChange("location", lang, e.target.value)
                        }
                    />
                ))}

                {/* IMAGES */}
                <h3>Фотографии</h3>
                <input type="file" onChange={upload} />

                <div className={s.images}>
                    {page.images.map((img, i) => (
                        <img key={i} src={img} width="150" />
                    ))}
                </div>

                {/* AMENITIES */}
                <h3>Преимущества</h3>

                <button type="button" onClick={addAmenity}>
                    Добавить
                </button>

                {page.amenities.map((a, i) => (
                    <div key={i}>
                        {["ru", "en", "uz"].map(lang => (
                            <input
                                key={lang}
                                placeholder={lang}
                                value={a[lang]}
                                onChange={(e) =>
                                    updateAmenity(i, lang, e.target.value)
                                }
                            />
                        ))}
                    </div>
                ))}

                <button className={s.button}>
                    Создать страницу
                </button>

            </form>
        </section>
    );
};

export default CreateCommercialPage;