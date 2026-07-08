import { useContext, useState } from "react";
import { MyContext } from "../Context";

const CreateCommercial = () => {

    const { createCommercial } = useContext(MyContext);


    const [form, setForm] = useState({

        title: "Коммерческая недвижимость",

        description: "",

        district: "",
        address: "",
        landmark: "",

        class_type: "",

        floor: "",
        ceiling_height: "",

        area: "",

        price: "",
        discount_price: "",
        discount: "",
        price_per_m2: "",

        status: "",
        delivery_date: "",

        image: ""

    });



    const change = (e) => {

        setForm({

            ...form,

            [e.target.name]: e.target.value

        });

    };



    const submit = async (e) => {

        e.preventDefault();


        await createCommercial(form);


        setForm({

            title: "Коммерческая недвижимость",

            description: "",

            district: "",
            address: "",
            landmark: "",

            class_type: "",

            floor: "",
            ceiling_height: "",

            area: "",

            price: "",
            discount_price: "",
            discount: "",
            price_per_m2: "",

            status: "",
            delivery_date: "",

            image: ""

        });

    };




    return (

        <form onSubmit={submit}>


            <input
                name="district"
                placeholder="Район"
                onChange={change}
            />


            <input
                name="address"
                placeholder="Адрес"
                onChange={change}
            />


            <input
                name="landmark"
                placeholder="Ориентир"
                onChange={change}
            />


            <input
                name="class_type"
                placeholder="Класс"
                onChange={change}
            />


            <input
                name="floor"
                placeholder="Этаж"
                onChange={change}
            />


            <input
                name="ceiling_height"
                placeholder="Высота потолка"
                onChange={change}
            />


            <input
                name="area"
                placeholder="Площадь"
                onChange={change}
            />


            <input
                name="price"
                placeholder="Цена"
                onChange={change}
            />


            <input
                name="discount_price"
                placeholder="Цена со скидкой"
                onChange={change}
            />


            <input
                name="price_per_m2"
                placeholder="Цена за м²"
                onChange={change}
            />


            <textarea
                name="description"
                placeholder="Описание"
                onChange={change}
            />


            <input
                name="image"
                placeholder="Ссылка фото"
                onChange={change}
            />


            <button>
                Создать
            </button>


        </form>

    );

};


export default CreateCommercial;