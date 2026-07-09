import Villa from "../components/Villa";
import Property from "../components/Property";
import Amenities from "../components/Amenities";
import Feautured from "../components/Feautured";
import Footer from "../components/Footer";
import Seo from "../components/Seo";


import { useParams } from "react-router-dom";
import { useContext, useEffect } from "react";
import { MyContext } from "../Context";
import { useTranslation } from "react-i18next";


const PropertyPage = () => {


    const { id } = useParams();
    const { i18n } = useTranslation();


    const {
        getVilla,
        villa
    } = useContext(MyContext);



    useEffect(() => {

        getVilla(id);

    }, [id]);




    if (!villa) return null;

    const seoTitle = villa.title?.[i18n.language] || villa.title?.ru;
    const seoDesc = villa.about?.[i18n.language] || villa.about?.ru;
    const seoImage = villa.images?.[0];

    return (

        <>
            <Seo title={seoTitle} description={seoDesc} image={seoImage} />

            <Villa data={villa} />


            <Property data={villa} />


            <Amenities data={villa} />


            <Feautured />


            <Footer />


        </>

    )


}


export default PropertyPage;