import Hero from '../components/Hero'
import Feautured from '../components/Feautured'
import What from '../components/What'
import Questions from '../components/Questions'
import Footer from '../components/Footer'
import CommercialSection from '../components/CommercialSection'
import Seo from '../components/Seo'

const Home = () => {
    return (
        <>
            <Seo title="Главная" description="UrbanKey — подбор вилл, квартир и коммерческой недвижимости. Ключи от вашей недвижимости." />
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