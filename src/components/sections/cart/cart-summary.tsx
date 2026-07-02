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
import { InfoOutlined } from '@mui/icons-material';
import { useCart, partitionCartByStorage, getCartItemsTotal } from '@/providers';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { calculateDeliveryFee, getDeliveryFeeEncouragement } from '@/lib/pricing/calculateDeliveryFee';

export function CartSummary() {
  const { items, itemCount, subtotal, discount, loading } = useCart();
  const locale = useLocale();
  const tc = useTranslations('cart');
  const router = useRouter();
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleCheckout = () => {
    router.push(`/${locale}/checkout`);
  };

  // Fees are calculated per order portion (in-stock vs special-order).
  const { inStorage, specialOrder } = partitionCartByStorage(items);
  const inStockBase = getCartItemsTotal(inStorage);
  const specialBase = getCartItemsTotal(specialOrder);
  const inStockFee = calculateDeliveryFee(inStockBase);
  const specialFee = calculateDeliveryFee(specialBase);
  const isSplit = inStorage.length > 0 && specialOrder.length > 0;
  const isSpecialOnly = inStorage.length === 0 && specialOrder.length > 0;
  const grandTotal = inStockBase + inStockFee + specialBase + specialFee;

  // Encouragement targets the in-stock portion (or the special one if that's all there is).
  const encBase = inStorage.length > 0 ? inStockBase : specialBase;
  const encouragement = getDeliveryFeeEncouragement(encBase);

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

  const money = (n: number) => `${n.toFixed(2)} ₾`;
  const row = (label: React.ReactNode, value: React.ReactNode, muted = false) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <Typography color={muted ? 'text.secondary' : undefined}>{label}</Typography>
      <Typography fontWeight={muted ? 400 : 600}>{value}</Typography>
    </Box>
  );

  const encouragementNote = encouragement && (
    <Stack direction="row" spacing={0.75} alignItems="flex-start" sx={{ mt: 0.5 }}>
      <InfoOutlined sx={{ fontSize: 16, color: 'warning.main', mt: '2px' }} />
      <Typography variant="caption" color="text.secondary">
        {tc('feeEncouragement', {
          amount: encouragement.amountToThreshold.toFixed(0),
          currentFee: encouragement.currentFee.toFixed(0),
          newFee: encouragement.thresholdFee.toFixed(0),
        })}
      </Typography>
    </Stack>
  );

  return (
    <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        {t.payment}
      </Typography>

      <Stack spacing={2} sx={{ mt: 3 }}>
        {isSplit ? (
          <>
            {row(tc('inStockSubtotal'), money(inStockBase))}
            {row(tc('deliveryFeeInStock'), money(inStockFee))}
            {encouragementNote}
            <Divider />
            {row(tc('specialOrderSubtotal'), money(specialBase))}
            {row(tc('deliveryFeeEstimated'), money(specialFee))}
          </>
        ) : (
          <>
            {row(`${t.products} (${itemCount})`, money(subtotal), true)}
            {discount > 0 &&
              row(
                t.discount,
                <Typography component="span" fontWeight={600} color="error.main">
                  -{money(discount)}
                </Typography>,
                true
              )}
            {row(isSpecialOnly ? tc('deliveryFeeEstimated') : tc('deliveryFee'), money(inStockFee + specialFee))}
            {encouragementNote}
          </>
        )}

        <Divider />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography fontWeight={600}>{isSplit ? tc('estimatedTotal') : t.totalPayment}</Typography>
          <Typography fontWeight={700} color="primary.main">
            {money(grandTotal)}
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
