'use client';

import { Box, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import { ProductRequestButton } from '@/components/common';

export function ProductRequestCta() {
  const t = useTranslations('productRequest');

  return (
    <Box sx={{ py: { xs: 2, md: 3.5 } }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: { xs: 2, md: 4 },
          p: { xs: 3, md: 4 },
          borderRadius: '16px',
          backgroundColor: '#F5F6FF',
          textAlign: { xs: 'center', md: 'left' },
        }}
      >
        <Typography sx={{ color: '#3E4388', fontWeight: 600, fontSize: { xs: '16px', md: '20px' } }}>
          {t('sectionText')}
        </Typography>
        <ProductRequestButton size="large" sx={{ flexShrink: 0, px: 4 }} />
      </Box>
    </Box>
  );
}
