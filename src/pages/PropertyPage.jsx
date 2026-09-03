import Villa from "../components/Villa";
import Property from "../components/Property";
import Amenities from "../components/Amenities";
import Feautured from "../components/Feautured_one";
import Footer from "../components/Footer";
import Seo from "../components/Seo";
import { buildResidenceJsonLd, buildBreadcrumbJsonLd } from "../utils/structuredData";


import { useParams } from "react-router-dom";
import { useContext, useEffect } from "react";
import { MyContext } from "../Context";
import { useTranslation } from "react-i18next";


const PropertyPage = () => {


    const { id } = useParams();
    const { t, i18n } = useTranslation();


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
    const seoUrl = `https://urbankey.uz/${i18n.language}/property/${id}`;

    const jsonLd = [
        buildResidenceJsonLd({ villa, lang: i18n.language, url: seoUrl }),
        buildBreadcrumbJsonLd(
            [
                { name: "UrbanKey", path: "/" },
                { name: t("properties"), path: "/Properties" },
                { name: seoTitle || "", path: `/property/${id}` },
            ],
            i18n.language
        ),
    ];

    return (

        <>
            <Seo title={seoTitle} description={seoDesc} image={seoImage} jsonLd={jsonLd} />

            <Villa data={villa} />


            <Property data={villa} />


            <Amenities data={villa} />


            <Feautured data={villa} />


            <Footer />


        </>

    )


}


export default PropertyPage;