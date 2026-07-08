import { useParams } from "react-router-dom";
import { useContext, useEffect } from "react";

import { MyContext } from "../Context";

import CommercialHero from "../components/CommercialHero";
import CommercialProperty from "../components/CommercialProperty";
import CommercialAmenities from "../components/CommercialAmenities";

import Feautured from "../components/Feautured_one";
import Footer from "../components/Footer";
import Connect from "../components/Connect_one";


const CommercialPage = () => {


    const { id } = useParams();


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


    return (
        <>
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