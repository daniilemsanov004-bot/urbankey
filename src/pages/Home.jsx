import React from 'react'
import Hero from '../components/Hero'
import Feautured from '../components/Feautured'
import What from '../components/What'
import Questions from '../components/Questions'
import Footer from '../components/Footer'
import CommercialSection from '../components/CommercialSection'

const Home = () => {
    return (
        <>
            <Hero />
            <Feautured />
            <CommercialSection />
            <What />
            <Questions />
            <Footer />
        </>
    )
}

export default Home