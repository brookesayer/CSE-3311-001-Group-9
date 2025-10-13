import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import heroSlides from '../data/heroSlides';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const HeroCarousel = () => {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: '70vh', minHeight: '500px' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={{
          prevEl: '.swiper-button-prev-custom',
          nextEl: '.swiper-button-next-custom',
        }}
        pagination={{
          el: '.swiper-pagination-custom',
          clickable: true,
          dynamicBullets: false,
          renderBullet: (index, className) => {
            return `<span class="${className}" role="button" aria-label="Go to slide ${index + 1}"></span>`;
          }
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
        }}
        effect="fade"
        fadeEffect={{
          crossFade: true,
        }}
        loop={true}
        className="h-full w-full"
        role="region"
        aria-label="Hero carousel showcasing DFW attractions"
      >
        {heroSlides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="relative h-full w-full">
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className="w-full h-full object-cover"
                loading={slide.id === 1 ? 'eager' : 'lazy'}
                style={{ aspectRatio: '16/9' }}
              />
              <div
                className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60"
                aria-hidden="true"
              />
              <div className="absolute inset-0 flex items-center justify-center px-4">
                <div className="text-center text-white z-10 max-w-4xl mx-auto">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 md:mb-6 drop-shadow-lg animate-fade-in">
                    {slide.title}
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 drop-shadow-md animate-slide-up px-4">
                    {slide.subtitle}
                  </p>
                  <Link
                    to={slide.ctaLink}
                    className="inline-block bg-adventure-600 hover:bg-adventure-700 text-white font-semibold text-sm sm:text-base md:text-lg px-6 sm:px-8 py-2 sm:py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-xl animate-scale-in focus:outline-none focus:ring-4 focus:ring-adventure-400"
                    aria-label={`${slide.ctaText} - ${slide.title}`}
                  >
                    {slide.ctaText}
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation Buttons */}
      <button
        className="swiper-button-prev-custom absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 sm:p-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Previous slide"
      >
        <ChevronLeftIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
      </button>

      <button
        className="swiper-button-next-custom absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 sm:p-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Next slide"
      >
        <ChevronRightIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
      </button>

      {/* Custom Pagination */}
      <div className="swiper-pagination-custom absolute bottom-6 sm:bottom-8 left-0 right-0 flex justify-center gap-2 z-10"></div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 1s ease-out 0.2s both;
        }

        .animate-scale-in {
          animation: scale-in 1s ease-out 0.4s both;
        }

        .swiper-pagination-custom :global(.swiper-pagination-bullet) {
          width: 10px;
          height: 10px;
          background: rgba(255, 255, 255, 0.5);
          opacity: 1;
          transition: all 0.3s ease;
          border-radius: 50%;
          cursor: pointer;
        }

        .swiper-pagination-custom :global(.swiper-pagination-bullet-active) {
          background: white;
          width: 24px;
          border-radius: 5px;
        }

        .swiper-pagination-custom :global(.swiper-pagination-bullet:hover) {
          background: rgba(255, 255, 255, 0.8);
        }
      `}</style>
    </div>
  );
};

export default HeroCarousel;
