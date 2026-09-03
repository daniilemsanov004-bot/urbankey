import Hero from '../components/Hero'
import Feautured from '../components/Feautured'
import What from '../components/What'
import Questions from '../components/Questions'
import Footer from '../components/Footer'
import CommercialSection from '../components/CommercialSection'
import Seo from '../components/Seo'
import { buildOrganizationJsonLd } from '../utils/structuredData'

const Home = () => {
    return (
        <>
            <Seo
                title="Недвижимость в Ташкенте"
                description="UrbanKey — подбор и продажа вилл, квартир и коммерческой недвижимости в Ташкенте. Ключи от вашей недвижимости."
                jsonLd={buildOrganizationJsonLd()}
            />
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