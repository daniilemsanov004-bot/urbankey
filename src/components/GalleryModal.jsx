import s from "./GalleryModal.module.css"

import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination } from "swiper/modules"
import { useEffect, useLayoutEffect, useRef } from "react";
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"

const GalleryModal = ({ images, activeIndex, onClose }) => {

    const swiperRef = useRef(null)
    useLayoutEffect(() => {
        if (!swiperRef.current) return;

        requestAnimationFrame(() => {
            swiperRef.current.update();

            if (images.length > 1) {
                swiperRef.current.slideToLoop(activeIndex, 0, false);
            } else {
                swiperRef.current.slideTo(activeIndex, 0, false);
            }
        });
    }, [activeIndex, images.length]);

    useEffect(() => {
        document.body.style.overflow = "hidden"
        document.body.style.height = "100vh"

        return () => {
            document.body.style.overflow = "auto"
            document.body.style.height = "auto"
        }
    }, [])

    const handleWheel = (e) => {
        e.preventDefault()

        if (!swiperRef.current) return

        if (e.deltaY > 0) {
            swiperRef.current.slideNext()
        } else {
            swiperRef.current.slidePrev()
        }
    }

    return (
        <div
            className={s.overlay}
            onClick={onClose}
            onWheel={handleWheel}
        >

            <div
                className={s.modal}
                onClick={(e) => e.stopPropagation()}
            >

                <button
                    className={s.close}
                    onClick={onClose}
                >
                    ✕
                </button>

                <Swiper
                    modules={[Navigation, Pagination]}
                    navigation
                    pagination={{ clickable: true }}
                    loop={images.length > 1}
                    initialSlide={activeIndex}
                    className={s.swiper}
                    observer
                    observeParents
                    onSwiper={(swiper) => {
                        swiperRef.current = swiper
                        requestAnimationFrame(() => swiper.update())
                    }}
                >

                    {images.map((img, i) => (
                        <SwiperSlide key={i} className={s.slide}>
                            <img src={img} alt="" />
                        </SwiperSlide>
                    ))}

                </Swiper>

            </div>

        </div>
    )
}

export default GalleryModal
