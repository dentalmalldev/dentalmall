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
import { LocationOn, Receipt, ShoppingBag, Inventory2Outlined, ScheduleOutlined } from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';
import { CartItem } from '@/types';
import { CheckoutOrderData } from '@/types/models';
import { partitionCartByStorage, getCartItemsTotal } from '@/providers';

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

  const { inStorage, specialOrder } = partitionCartByStorage(items);
  const isSplit = inStorage.length > 0 && specialOrder.length > 0;
  const inStorageTotal = getCartItemsTotal(inStorage);
  const specialOrderTotal = getCartItemsTotal(specialOrder);

  const getProductName = (item: CartItem) =>
    locale === 'ka' ? item.product.name_ka : item.product.name;

  const getVariantName = (item: CartItem) => {
    if (!item.variant_option) return null;
    return locale === 'ka' ? item.variant_option.name_ka : item.variant_option.name;
  };

  const getItemPrice = (item: CartItem) => {
    const source = item.variant_option || item.product;
    const original = item.variant_option
      ? parseFloat(item.variant_option.dentalmall_price)
      : parseFloat(item.product.price);
    const price = source.sale_price ? parseFloat(source.sale_price) : original;
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
                <Box>
                  <Typography fontWeight={500}>
                    {orderData.address.recipient_name} · {orderData.address.mobile_number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {orderData.address.city}, {orderData.address.address}
                    {orderData.address.postal_code ? `, ${orderData.address.postal_code}` : ''}
                  </Typography>
                </Box>
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
                  {getVariantName(item) && (
                    <Typography variant="body2" color="primary.main" fontWeight={500}>
                      {getVariantName(item)}
                    </Typography>
                  )}
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

          {/* Fulfilment breakdown — only when the cart will split into two orders */}
          {isSplit && (
            <Box
              sx={{
                mb: 2,
                p: 2,
                borderRadius: '12px',
                bgcolor: 'grey.50',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Inventory2Outlined fontSize="small" sx={{ color: '#16A34A' }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {t('inStockLabel')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('inStockDeliveryEstimate')} · {t('itemsCount', { count: inStorage.length })}
                    </Typography>
                  </Box>
                </Stack>
                <Typography fontWeight={600}>₾{inStorageTotal.toFixed(2)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ScheduleOutlined fontSize="small" sx={{ color: '#F59E0B' }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {t('specialOrderLabel')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('specialOrderDeliveryEstimate')} · {t('itemsCount', { count: specialOrder.length })}
                    </Typography>
                  </Box>
                </Stack>
                <Typography fontWeight={600}>₾{specialOrderTotal.toFixed(2)}</Typography>
              </Stack>
            </Box>
          )}

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
