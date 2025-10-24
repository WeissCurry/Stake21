'use client'

import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'

import LogoBase from '../../../public/BaseLogo.png'
import LogoEth from '../../../public/EthLogo.png'

const logos = [
    { src: LogoBase, alt: 'Base' },
    { src: LogoEth, alt: 'Ethereum' },
    { src: LogoBase, alt: 'Base' },
    { src: LogoEth, alt: 'Ethereum' },
    { src: LogoBase, alt: 'Base' },
    { src: LogoEth, alt: 'Ethereum' },

]

export default function SwiperPartner() {
    return (
        <div className="mt-16 relative">
            {/* Optional efek gradient di sisi kiri & kanan */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

            <Swiper
                modules={[Autoplay]}
                slidesPerView={5}
                spaceBetween={0}
                loop
                speed={4000}
                autoplay={{
                    delay: 0,
                    disableOnInteraction: false,
                }}
                breakpoints={{
                    320: { slidesPerView: 2 },
                    640: { slidesPerView: 3 },
                    1024: { slidesPerView: 5 },
                }}
            >
                {logos.map((logo, index) => (
                    <SwiperSlide key={index} className="flex items-center justify-center">
                        <Image
                            src={logo.src}
                            alt={logo.alt}
                            className="opacity-80 hover:opacity-100 transition-opacity"
                            width={100}
                            height={50}
                        />
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    )
}
