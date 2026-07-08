import Villa from "../components/Villa";
import Property from "../components/Property";
import Amenities from "../components/Amenities";
import Feautured from "../components/Feautured";
import Footer from "../components/Footer";


import { useParams } from "react-router-dom";
import { useContext, useEffect } from "react";
import { MyContext } from "../Context";


const PropertyPage = () => {


    const { id } = useParams();


    const {
        getVilla,
        villa
    } = useContext(MyContext);



    useEffect(() => {

        getVilla(id);

    }, [id]);




    if (!villa) return null;


    return (

        <>

            <Villa data={villa} />


            <Property data={villa} />


            <Amenities data={villa} />


            <Feautured />


            <Footer />


        </>

    )


}


export default PropertyPage;