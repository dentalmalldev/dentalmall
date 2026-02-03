'use client';

import {
  Box,
  Paper,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  Divider,
} from '@mui/material';
import { useCart } from '@/providers';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CartSummary() {
  const { itemCount, subtotal, discount, total, loading } = useCart();
  const locale = useLocale();
  const router = useRouter();
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleCheckout = () => {
    router.push(`/${locale}/checkout`);
  };

  const translations = {
    ka: {
      payment: 'გადახდა',
      products: 'პროდუქტები',
      deliveryFee: 'მიწოდების საფასური',
      discount: 'ფასდაკლება',
      totalPayment: 'ჯამური ღირებულება',
      calculateOnDelivery: 'გამოითვლება გადახდის დროს',
      termsText: 'ვეთანხმები წესებსა და პირობებს (წაკითხვა)',
      checkout: 'შეკვეთის გაფორმება',
    },
    en: {
      payment: 'Payment',
      products: 'Products',
      deliveryFee: 'Delivery fee',
      discount: 'Discount',
      totalPayment: 'Total payment',
      calculateOnDelivery: 'Calculated at checkout',
      termsText: 'I agree to the terms and conditions (Read)',
      checkout: 'Checkout',
    },
  };

  const t = translations[locale as 'ka' | 'en'] || translations.en;

  return (
    <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        {t.payment}
      </Typography>

      <Stack spacing={2} sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography color="text.secondary">
            {t.products} ({itemCount})
          </Typography>
          <Typography fontWeight={600}>{subtotal.toFixed(2)} ₾</Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography color="text.secondary">{t.deliveryFee}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t.calculateOnDelivery}
          </Typography>
        </Box>

        {discount > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">{t.discount}</Typography>
            <Typography fontWeight={600} color="error.main">
              -{discount.toFixed(2)} ₾
            </Typography>
          </Box>
        )}

        <Divider />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography fontWeight={600}>{t.totalPayment}</Typography>
          <Typography fontWeight={700} color="primary.main">
            {total.toFixed(2)} ₾
          </Typography>
        </Box>
      </Stack>

      <FormControlLabel
        control={
          <Checkbox
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            color="primary"
          />
        }
        label={
          <Typography variant="body2" color="text.secondary">
            {t.termsText}
          </Typography>
        }
        sx={{ mt: 3, alignItems: 'flex-start' }}
      />

      <Button
        variant="contained"
        fullWidth
        size="large"
        disabled={!termsAccepted || loading || itemCount === 0}
        onClick={handleCheckout}
        sx={{ mt: 2 }}
      >
        {t.checkout}
      </Button>
    </Paper>
  );
}
