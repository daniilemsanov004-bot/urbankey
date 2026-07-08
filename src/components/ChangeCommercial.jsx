import { useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { MyContext } from "../Context";

import s from "./ChangeCommercial.module.css";


const ChangeCommercial = () => {


    const { id } = useParams();


    const {
        commercials,
        updateCommercial,
        getCommercials
    } = useContext(MyContext);



    const {
        register,
        handleSubmit,
        setValue
    } = useForm();




    useEffect(() => {

        getCommercials();

    }, []);





    useEffect(() => {


        const item = commercials.find(
            x => x.id == id
        );


        if (!item) return;



        setValue(
            "titleRu",
            item.title?.ru || ""
        );

        setValue(
            "titleEn",
            item.title?.en || ""
        );

        setValue(
            "titleUz",
            item.title?.uz || ""
        );




        setValue(
            "descriptionRu",
            item.description?.ru || ""
        );

        setValue(
            "descriptionEn",
            item.description?.en || ""
        );

        setValue(
            "descriptionUz",
            item.description?.uz || ""
        );




        setValue(
            "districtRu",
            item.district?.ru || ""
        );

        setValue(
            "districtEn",
            item.district?.en || ""
        );

        setValue(
            "districtUz",
            item.district?.uz || ""
        );




        setValue(
            "addressRu",
            item.address?.ru || ""
        );

        setValue(
            "addressEn",
            item.address?.en || ""
        );

        setValue(
            "addressUz",
            item.address?.uz || ""
        );




        setValue(
            "classRu",
            item.class?.ru || ""
        );

        setValue(
            "classEn",
            item.class?.en || ""
        );

        setValue(
            "classUz",
            item.class?.uz || ""
        );





        setValue(
            "landmarkRu",
            item.landmark?.ru || ""
        );

        setValue(
            "landmarkEn",
            item.landmark?.en || ""
        );

        setValue(
            "landmarkUz",
            item.landmark?.uz || ""
        );





        setValue(
            "statusRu",
            item.status?.ru || ""
        );

        setValue(
            "statusEn",
            item.status?.en || ""
        );

        setValue(
            "statusUz",
            item.status?.uz || ""
        );





        setValue(
            "floor",
            item.floor || ""
        );


        setValue(
            "ceiling",
            item.ceiling_height || ""
        );


        setValue(
            "area",
            item.area || ""
        );


        setValue(
            "price",
            item.price || ""
        );


        setValue(
            "discount_price",
            item.discount_price || ""
        );


        setValue(
            "image",
            item.image || ""
        );


    }, [commercials, id]);









    const onSubmit = (data) => {


        const updated = {



            title: {

                ru: data.titleRu,
                en: data.titleEn,
                uz: data.titleUz

            },



            description: {

                ru: data.descriptionRu,
                en: data.descriptionEn,
                uz: data.descriptionUz

            },



            district: {

                ru: data.districtRu,
                en: data.districtEn,
                uz: data.districtUz

            },



            address: {

                ru: data.addressRu,
                en: data.addressEn,
                uz: data.addressUz

            },



            class: {

                ru: data.classRu,
                en: data.classEn,
                uz: data.classUz

            },



            landmark: {

                ru: data.landmarkRu,
                en: data.landmarkEn,
                uz: data.landmarkUz

            },



            status: {

                ru: data.statusRu,
                en: data.statusEn,
                uz: data.statusUz

            },



            floor: data.floor,

            ceiling: data.ceiling,

            area: data.area,


            price: data.price,

            discount_price: data.discount_price,


            image: data.image


        };



        updateCommercial(
            updated,
            id
        );


    };







    return (


        <section className={s.change}>


            <form
                className={s.form}
                onSubmit={
                    handleSubmit(onSubmit)
                }
            >



                <h1>
                    Изменить коммерцию
                </h1>





                {
                    [

                        "titleRu",
                        "titleEn",
                        "titleUz",

                        "descriptionRu",
                        "descriptionEn",
                        "descriptionUz",

                        "districtRu",
                        "districtEn",
                        "districtUz",

                        "addressRu",
                        "addressEn",
                        "addressUz",

                        "classRu",
                        "classEn",
                        "classUz",

                        "landmarkRu",
                        "landmarkEn",
                        "landmarkUz",

                        "statusRu",
                        "statusEn",
                        "statusUz",

                        "floor",
                        "ceiling",
                        "area",

                        "price",
                        "discount_price",

                        "image"


                    ].map(
                        field => (


                            <input

                                key={field}

                                className={s.input}

                                placeholder={field}

                                {...register(field)}

                            />


                        ))
                }





                <button
                    className={s.btn}
                    type="submit"
                >

                    Сохранить

                </button>




            </form>


        </section>


    );


};


export default ChangeCommercial;