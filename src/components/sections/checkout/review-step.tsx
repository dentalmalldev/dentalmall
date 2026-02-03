'use client';

import {
  Box,
  Typography,
  Button,
  Stack,
  Paper,
  Divider,
  TextField,
  CircularProgress,
} from '@mui/material';
import { LocationOn, Receipt, ShoppingBag } from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';
import { CartItem } from '@/types';
import { CheckoutOrderData } from '@/types/models';

interface ReviewStepProps {
  orderData: CheckoutOrderData;
  items: CartItem[];
  subtotal: number;
  total: number;
  notes: string;
  onNotesChange: (notes: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function ReviewStep({
  orderData,
  items,
  subtotal,
  total,
  notes,
  onNotesChange,
  onBack,
  onSubmit,
  isSubmitting,
}: ReviewStepProps) {
  const t = useTranslations('checkout');
  const locale = useLocale();

  const getProductName = (item: CartItem) =>
    locale === 'ka' ? item.product.name_ka : item.product.name;

  const getItemPrice = (item: CartItem) => {
    const price = item.product.sale_price
      ? parseFloat(item.product.sale_price)
      : parseFloat(item.product.price);
    return price * item.quantity;
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {t('reviewOrder')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('reviewOrderDescription')}
      </Typography>

      <Stack spacing={3}>
        {/* Delivery Address */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px' }}>
          <Stack direction="row" alignItems="flex-start" spacing={2}>
            <LocationOn color="primary" />
            <Box flex={1}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('deliveryAddress')}
              </Typography>
              {orderData.address && (
                <Typography fontWeight={500}>
                  {orderData.address.city}, {orderData.address.address}
                </Typography>
              )}
            </Box>
          </Stack>
        </Paper>

        {/* Payment Method */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px' }}>
          <Stack direction="row" alignItems="flex-start" spacing={2}>
            <Receipt color="primary" />
            <Box flex={1}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('paymentMethod')}
              </Typography>
              <Typography fontWeight={500}>
                {t('invoicePayment')}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Order Items */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px' }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <ShoppingBag color="primary" />
            <Typography variant="subtitle2" color="text.secondary">
              {t('orderItems')} ({items.length})
            </Typography>
          </Stack>

          <Stack spacing={2} divider={<Divider />}>
            {items.map((item) => (
              <Stack
                key={item.id}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography fontWeight={500}>
                    {getProductName(item)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('quantity')}: {item.quantity}
                  </Typography>
                </Box>
                <Typography fontWeight={600}>
                  ₾{getItemPrice(item).toFixed(2)}
                </Typography>
              </Stack>
            ))}
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">{t('subtotal')}</Typography>
              <Typography>₾{subtotal.toFixed(2)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">{t('delivery')}</Typography>
              <Typography color="text.secondary">{t('free')}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="h6" fontWeight={700}>
                {t('total')}
              </Typography>
              <Typography variant="h6" fontWeight={700} color="primary.main">
                ₾{total.toFixed(2)}
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        {/* Notes */}
        <TextField
          label={t('orderNotes')}
          placeholder={t('orderNotesPlaceholder')}
          multiline
          rows={3}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          fullWidth
        />
      </Stack>

      {/* Navigation */}
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
        <Button
          variant="outlined"
          size="large"
          onClick={onBack}
          disabled={isSubmitting}
        >
          {t('back')}
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={onSubmit}
          disabled={isSubmitting}
          sx={{ minWidth: 180 }}
        >
          {isSubmitting ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            t('confirmOrder')
          )}
        </Button>
      </Stack>
    </Box>
  );
}
