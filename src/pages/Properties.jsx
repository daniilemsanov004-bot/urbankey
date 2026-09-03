import React from 'react'
import Find from '../components/Find'
import Catalog from '../components/Catalog'
import Footer from '../components/Footer'
import Seo from '../components/Seo'


const Properties = () => {
  return (
    <>
      <Seo title="Купить недвижимость в Ташкенте" description="Каталог недвижимости в Ташкенте: виллы, квартиры и коммерческие объекты. Актуальные предложения и цены от UrbanKey." />
      <Find />
      <Catalog />
      <Footer />
    </>
  )
}

export default Properties