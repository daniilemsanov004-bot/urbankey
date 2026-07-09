import React from 'react'
import Elevate from '../components/Elevate'
import Unlock from '../components/Unlock'
import Effortless from '../components/Effortless'
import Smart from '../components/Smart'
import Footer from '../components/Footer'
import Seo from '../components/Seo'

const Services = () => {
  return (
    <>
      <Seo title="Сервисы" description="Услуги UrbanKey: подбор объектов, сопровождение сделок, консультации." />
      <Elevate />
      <Unlock />
      <Effortless />
      <Smart />
      <Footer />
    </>
  )
}

export default Services