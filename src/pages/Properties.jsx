import React from 'react'
import Find from '../components/Find'
import Catalog from '../components/Catalog'
import Footer from '../components/Footer'
import Seo from '../components/Seo'


const Properties = () => {
  return (
    <>
      <Seo title="Недвижимость" description="Каталог объектов недвижимости UrbanKey: виллы, квартиры, коммерческая недвижимость." />
      <Find />
      <Catalog />
      <Footer />
    </>
  )
}

export default Properties