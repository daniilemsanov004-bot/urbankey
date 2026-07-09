import { useParams } from "react-router-dom";
import { useContext, useEffect } from "react";

import { MyContext } from "../Context";

import CommercialHero from "../components/CommercialHero";
import CommercialProperty from "../components/CommercialProperty";
import CommercialAmenities from "../components/CommercialAmenities";

import Feautured from "../components/Feautured_one";
import Footer from "../components/Footer";
import Connect from "../components/Connect_one";
import Seo from "../components/Seo";
import { useTranslation } from "react-i18next";


const CommercialPage = () => {


    const { id } = useParams();
    const { i18n } = useTranslation();


    const {
        getCommercialPage,
        getCommercialById,
        commercialPage
    } = useContext(MyContext);


    useEffect(() => {

        if (id) {
            getCommercialById(id);
        }

    }, [id]);


    if (!commercialPage) return null;

    const seoTitle = commercialPage.title?.[i18n.language] || commercialPage.title?.ru;
    const seoDesc = commercialPage.about?.[i18n.language] || commercialPage.about?.ru;
    const seoImage = commercialPage.images?.[0];


    return (
        <>
            <Seo title={seoTitle} description={seoDesc} image={seoImage} />
            <CommercialHero data={commercialPage} />
            <CommercialProperty data={commercialPage} />
            <CommercialAmenities data={commercialPage} />
            <Feautured data={commercialPage} commercial={true} />
            <Connect />
            <Footer />
        </>
    )
}


export default CommercialPage;