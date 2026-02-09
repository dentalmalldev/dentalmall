'use client';

import { Box, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

// Mock partner store data - you can replace with actual logos
const partnerStores = [
  { id: '1', name: 'Partner 1', logo: '/partners/partner1.png' },
  { id: '2', name: 'Partner 2', logo: '/partners/partner2.png' },
  { id: '3', name: 'Partner 3', logo: '/partners/partner3.png' },
  { id: '4', name: 'Partner 4', logo: '/partners/partner4.png' },
  { id: '5', name: 'Partner 5', logo: '/partners/partner5.png' },
  { id: '6', name: 'Partner 6', logo: '/partners/partner6.png' },
  { id: '7', name: 'Partner 7', logo: '/partners/partner7.png' },
];

export function PartnerStores() {
  const t = useTranslations('partnerStoresSection');

  return (
    <Box sx={{ padding: { xs: '16px 16px', md: '28px 120px' } }}>
      <Typography
        variant="h4"
        sx={{
          color: '#3E4388',
          marginBottom: 4,
          textAlign: { xs: 'center', md: 'left' },
        }}
      >
        {t('title')}
      </Typography>

      <Swiper
        spaceBetween={12}
        slidesPerView={3}
        breakpoints={{
          600: {
            slidesPerView: 4,
            spaceBetween: 16,
          },
          900: {
            slidesPerView: 5,
            spaceBetween: 20,
          },
          1200: {
            slidesPerView: 7,
            spaceBetween: 24,
          },
        }}
      >
        {partnerStores.map((store) => (
          <SwiperSlide key={store.id}>
            <Box
              sx={{
                width: '100%',
                aspectRatio: '1',
                maxWidth: '140px',
                borderRadius: '50%',
                backgroundColor: '#D4D7F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
                margin: '0 auto',
                '&:hover': {
                  transform: 'scale(1.05)',
                  backgroundColor: '#C8CCF0',
                },
              }}
            >
              {/* Placeholder for partner logo */}
              {/* <Box
                sx={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                }}
              /> */}
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  );
}
