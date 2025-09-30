import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const HeroCarousel = () => {
  const heroImages = [
    {
      id: 1,
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      title: 'Discover Amazing Mountains',
      subtitle: 'Experience breathtaking peaks and pristine wilderness'
    },
    {
      id: 2,
      url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      title: 'Explore Tropical Paradises',
      subtitle: 'Crystal clear waters and endless adventures await'
    },
    {
      id: 3,
      url: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      title: 'Journey Through Time',
      subtitle: 'Discover ancient wonders and cultural treasures'
    },
    {
      id: 4,
      url: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      title: 'Wildlife Adventures',
      subtitle: 'Get close to nature in its purest form'
    }
  ];

  return (
    <div className="relative h-[70vh] overflow-hidden">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={{
          prevEl: '.swiper-button-prev-custom',
          nextEl: '.swiper-button-next-custom',
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        effect="fade"
        fadeEffect={{
          crossFade: true,
        }}
        loop={true}
        className="h-full"
      >
        {heroImages.map((image) => (
          <SwiperSlide key={image.id}>
            <div className="relative h-full">
              <img
                src={image.url}
                alt={image.title}
                className="w-full h-full object-cover"
              />
              <div className="gradient-overlay" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white z-10 px-4">
                  <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-fade-in">
                    {image.title}
                  </h1>
                  <p className="text-xl md:text-2xl mb-8 animate-slide-up">
                    {image.subtitle}
                  </p>
                  <button className="btn-primary text-lg px-8 py-3 animate-scale-in">
                    Start Exploring
                  </button>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <button className="swiper-button-prev-custom absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-200">
        <ChevronLeftIcon className="h-6 w-6 text-white" />
      </button>

      <button className="swiper-button-next-custom absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-200">
        <ChevronRightIcon className="h-6 w-6 text-white" />
      </button>

      <style jsx>{`
        .swiper-pagination {
          bottom: 2rem !important;
        }
        .swiper-pagination-bullet {
          width: 12px !important;
          height: 12px !important;
          background: rgba(255, 255, 255, 0.6) !important;
          opacity: 1 !important;
        }
        .swiper-pagination-bullet-active {
          background: white !important;
          transform: scale(1.2) !important;
        }
      `}</style>
    </div>
  );
};

export default HeroCarousel;