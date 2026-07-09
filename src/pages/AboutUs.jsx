import Journey from '../components/Journey'
import Value from '../components/Value'
import Navigating from '../components/Navigating'
import Realtor from '../components/Realtor'
import Achievements from '../components/Achievements'
import Footer from '../components/Footer'
import Seo from '../components/Seo'

const AboutUs = () => {
  return (
    <>
      <Seo title="Компания" description="О компании UrbanKey: наша миссия, ценности и команда." />
      <Journey />
      <Value />
      <Achievements />
      <Navigating />
      <Realtor />
      <Footer />
    </>
  )
}

export default AboutUs