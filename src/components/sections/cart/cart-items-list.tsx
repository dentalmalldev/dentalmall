'use client';

import { Box, Paper, Typography, Stack, Skeleton } from '@mui/material';
import { useCart } from '@/providers';
import { useLocale, useTranslations } from 'next-intl';
import { CartItem } from '@/types';
import { CartItemCard } from './cart-item-card';

interface GroupedItems {
  [manufacturer: string]: CartItem[];
}

export function CartItemsList() {
  const { items, loading } = useCart();
  const locale = useLocale();
  const t = useTranslations('productsSection');

  if (loading && items.length === 0) {
    return (
      <Stack spacing={2}>
        {[1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={200} />
        ))}
      </Stack>
    );
  }

  // Group items by manufacturer
  const groupedItems = items.reduce<GroupedItems>((acc, item) => {
    const manufacturer = item.product.manufacturer || t('manufacturer');
    if (!acc[manufacturer]) {
      acc[manufacturer] = [];
    }
    acc[manufacturer].push(item);
    return acc;
  }, {});

  return (
    <Stack spacing={3}>
      {Object.entries(groupedItems).map(([manufacturer, manufacturerItems]) => (
        <Paper key={manufacturer} sx={{ p: 0, overflow: 'hidden' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 3,
              py: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              {t('manufacturer')}:{manufacturer}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {manufacturerItems.length}{' '}
              {locale === 'ka' ? 'პროდუქტი' : manufacturerItems.length === 1 ? 'product' : 'products'}
            </Typography>
          </Box>

          <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
            {manufacturerItems.map((item) => (
              <CartItemCard key={item.id} item={item} />
            ))}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
