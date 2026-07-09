import Connect from '../components/Connect'
import Footer from '../components/Footer'
import Get from '../components/Get'
import World from '../components/World'
import Seo from '../components/Seo'

const ContactUs = () => {
  return (
    <>
      <Seo title="Контакты" description="Свяжитесь с UrbanKey: телефон, адрес, форма обратной связи." />
      <Get />
      <Connect />
      <World />
      <Footer />
    </>
  )
}

export default ContactUs