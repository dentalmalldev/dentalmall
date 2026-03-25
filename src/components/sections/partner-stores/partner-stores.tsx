'use client';

import { Box, Typography, Avatar, Skeleton } from '@mui/material';
import { Store as StoreIcon } from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

interface PublicVendor {
  id: string;
  company_name: string;
  logo: string | null;
}

export function PartnerStores() {
  const t = useTranslations('partnerStoresSection');
  const locale = useLocale();
  const router = useRouter();

  const { data: vendors = [], isLoading } = useQuery<PublicVendor[]>({
    queryKey: ['vendors', 'public'],
    queryFn: async () => {
      const res = await fetch('/api/vendors?public=true');
      if (!res.ok) throw new Error('Failed to fetch vendors');
      return res.json();
    },
  });

  return (
    <Box sx={{ mb: 4 }}>
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
        style={{ overflow: 'visible' }}
        breakpoints={{
          600: { slidesPerView: 4, spaceBetween: 16 },
          900: { slidesPerView: 5, spaceBetween: 20 },
          1200: { slidesPerView: 7, spaceBetween: 24 },
        }}
      >
        {isLoading
          ? [1, 2, 3, 4, 5, 6, 7].map((i) => (
              <SwiperSlide key={i}>
                <Skeleton
                  variant="circular"
                  sx={{ width: '100%', maxWidth: 140, aspectRatio: '1', mx: 'auto' }}
                />
              </SwiperSlide>
            ))
          : vendors.map((vendor) => (
              <SwiperSlide key={vendor.id}>
                <Box
                  onClick={() => router.push(`/${locale}/vendors/${vendor.id}`)}
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
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      backgroundColor: '#C8CCF0',
                    },
                  }}
                >
                  <Avatar
                    src={vendor.logo ?? undefined}
                    sx={{
                      width: '100%',
                      height: '100%',
                      bgcolor: 'transparent',
                      borderRadius: '50%',
                      '& img': { objectFit: 'cover' },
                    }}
                  >
                    <StoreIcon sx={{ color: '#5B6ECD', fontSize: 40 }} />
                  </Avatar>
                </Box>
              </SwiperSlide>
            ))}
      </Swiper>
    </Box>
  );
}
