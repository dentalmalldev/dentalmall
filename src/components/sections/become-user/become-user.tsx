'use client';

import { Box, Typography, Button } from '@mui/material';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export function BecomeUser() {
  const t = useTranslations('becomeUserSection');

  return (
    <Box
      sx={{
        padding: { xs: '32px 16px', md: '60px 120px' },
        backgroundColor: '#F9FAFB',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 4,
          alignItems: 'center',
          margin: '0 auto',
        }}
      >
        {/* Image Section */}
        <Box
          sx={{
            flex: { xs: '0 0 auto', md: 1 },
            position: 'relative',
            width: '100%',
            minHeight: { xs: '300px', md: '400px' },
            height: { xs: '300px', md: '400px' },
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          <Image
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVGP42vauaCkL_q8Enb7M5ukT01GucXoiLaQ&s"
            alt="Dentist with patient"
            fill
            style={{ objectFit: 'cover' }}
          />
        </Box>

        {/* Content Section */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            alignItems: { xs: 'center', md: 'flex-start' },
            textAlign: { xs: 'center', md: 'left' },
          }}
        >
          <Typography
            variant="h3"
            sx={{
              color: '#3E4388',
              fontWeight: 700,
              fontSize: { xs: '24px', md: '32px' },
            }}
          >
            {t('title')}
          </Typography>

          <Typography
            sx={{
              color: '#6B7280',
              fontSize: { xs: '16px', md: '18px' },
            }}
          >
            {t('subtitle')}
          </Typography>

          <Button
            variant="contained"
            sx={{
              backgroundColor: '#5B6ECD',
              color: 'white',
              padding: '12px 48px',
              borderRadius: '100px',
              textTransform: 'none',
              fontSize: '16px',
              fontWeight: 600,
              marginTop: 2,
              '&:hover': {
                backgroundColor: '#4A5BC0',
              },
            }}
          >
            {t('cta')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
