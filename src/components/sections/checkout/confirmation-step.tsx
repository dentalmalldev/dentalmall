'use client';

import {
  Box,
  Typography,
  Button,
  Stack,
  Paper,
} from '@mui/material';
import { CheckCircle, Email, Home } from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

interface ConfirmationStepProps {
  orderNumber: string;
  email: string;
}

export function ConfirmationStep({ orderNumber, email }: ConfirmationStepProps) {
  const t = useTranslations('checkout');
  const locale = useLocale();
  const router = useRouter();

  return (
    <Box textAlign="center" py={4}>
      {/* Success Icon */}
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: 'success.light',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 3,
        }}
      >
        <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />
      </Box>

      <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
        {t('thankYou')}
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
        {t('orderConfirmationMessage')}
      </Typography>

      {/* Order Number */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: '16px',
          bgcolor: 'primary.50',
          maxWidth: 400,
          mx: 'auto',
          mb: 4,
        }}
      >
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('orderNumber')}
        </Typography>
        <Typography variant="h5" fontWeight={700} color="primary.main">
          {orderNumber}
        </Typography>
      </Paper>

      {/* Email Notification */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={1}
        sx={{ mb: 4 }}
      >
        <Email color="action" />
        <Typography variant="body2" color="text.secondary">
          {t('invoiceSentTo')} <strong>{email}</strong>
        </Typography>
      </Stack>

      {/* What's Next */}
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          borderRadius: '16px',
          maxWidth: 500,
          mx: 'auto',
          mb: 4,
          textAlign: 'left',
        }}
      >
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {t('whatsNext')}
        </Typography>
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            • {t('nextStep1')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • {t('nextStep2')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • {t('nextStep3')}
          </Typography>
        </Stack>
      </Paper>

      {/* Action Buttons */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="center"
      >
        <Button
          variant="outlined"
          size="large"
          startIcon={<Home />}
          onClick={() => router.push(`/${locale}`)}
        >
          {t('backToHome')}
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={() => router.push(`/${locale}/profile?tab=orders`)}
        >
          {t('viewOrders')}
        </Button>
      </Stack>
    </Box>
  );
}
