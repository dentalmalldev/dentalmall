'use client';

import {
  Box,
  Typography,
  Button,
  Stack,
  Paper,
  Alert,
} from '@mui/material';
import { Receipt, Info } from '@mui/icons-material';
import { useTranslations } from 'next-intl';

interface PaymentStepProps {
  paymentMethod: string;
  onBack: () => void;
  onNext: () => void;
}

export function PaymentStep({ paymentMethod, onBack, onNext }: PaymentStepProps) {
  const t = useTranslations('checkout');

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {t('paymentMethod')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('paymentMethodDescription')}
      </Typography>

      {/* Invoice Payment Option */}
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          borderRadius: '12px',
          borderColor: 'primary.main',
          borderWidth: 2,
          bgcolor: 'primary.50',
        }}
      >
        <Stack direction="row" alignItems="flex-start" spacing={2}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: '12px',
              bgcolor: 'primary.main',
              color: 'white',
              display: 'flex',
            }}
          >
            <Receipt />
          </Box>
          <Box flex={1}>
            <Typography variant="subtitle1" fontWeight={600}>
              {t('invoicePayment')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t('invoicePaymentDescription')}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Information Alert */}
      <Alert
        severity="info"
        icon={<Info />}
        sx={{
          mt: 3,
          borderRadius: '12px',
          '& .MuiAlert-message': { width: '100%' },
        }}
      >
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          {t('invoiceInfo')}
        </Typography>
        <Typography variant="body2">
          {t('invoiceInfoDescription')}
        </Typography>
      </Alert>

      {/* Navigation */}
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
        <Button variant="outlined" size="large" onClick={onBack}>
          {t('back')}
        </Button>
        <Button variant="contained" size="large" onClick={onNext}>
          {t('continue')}
        </Button>
      </Stack>
    </Box>
  );
}
