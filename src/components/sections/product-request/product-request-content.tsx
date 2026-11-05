'use client';

import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { CheckCircle as SuccessIcon } from '@mui/icons-material';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useProductRequestEntry } from '@/hooks/useProductRequestEntry';
import { useAuth } from '@/providers';
import { colors } from '@/theme';
import { ProductRequestForm } from './product-request-form';

const pageSx = { pt: { xs: 2, md: 3.5 }, pb: { xs: '100px', md: '40px' } };

export function ProductRequestContent() {
  const t = useTranslations('productRequest');
  const locale = useLocale();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { promptLogin } = useProductRequestEntry();
  const [sent, setSent] = useState(false);

  // Someone who opened this URL directly, or signed out here.
  useEffect(() => {
    if (!loading && !user) promptLogin({ replace: true });
  }, [loading, promptLogin, user]);

  if (loading) {
    return (
      <Box sx={{ ...pageSx, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Stack sx={pageSx} alignItems="center" textAlign="center" gap={2}>
        <Typography>{t('loginPrompt')}</Typography>
        <Button variant="contained" onClick={() => promptLogin()} sx={{ textTransform: 'none' }}>
          {t('login')}
        </Button>
      </Stack>
    );
  }

  if (sent) {
    return (
      <Stack sx={pageSx} alignItems="center" textAlign="center" gap={3}>
        <SuccessIcon color="success" sx={{ fontSize: 72 }} />
        <Typography variant="h5" sx={{ color: '#3E4388', maxWidth: '560px' }}>
          {t('successMessage')}
        </Typography>
        <Button
          variant="contained"
          onClick={() => router.push(`/${locale}/categories`)}
          sx={{
            borderRadius: '100px',
            textTransform: 'none',
            fontWeight: 600,
            backgroundColor: colors.accent.main,
            '&:hover': { backgroundColor: colors.accent.hover },
          }}
        >
          {t('browseProducts')}
        </Button>
      </Stack>
    );
  }

  return (
    <Box sx={pageSx}>
      <ProductRequestForm key={user.uid} user={user} onSent={() => setSent(true)} />
    </Box>
  );
}
