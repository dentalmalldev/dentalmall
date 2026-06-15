'use client';

import { Box, Paper, Typography, Stack, Skeleton, Chip } from '@mui/material';
import { Inventory2Outlined, ScheduleOutlined } from '@mui/icons-material';
import { useCart, getCartItemsTotal, partitionCartByStorage } from '@/providers';
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
  const tCart = useTranslations('cart');

  if (loading && items.length === 0) {
    return (
      <Stack spacing={2}>
        {[1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={200} />
        ))}
      </Stack>
    );
  }

  // Group items by manufacturer (preserves the existing per-manufacturer cards).
  const groupByManufacturer = (list: CartItem[]): GroupedItems =>
    list.reduce<GroupedItems>((acc, item) => {
      const manufacturer = item.product.manufacturer || t('manufacturer');
      if (!acc[manufacturer]) acc[manufacturer] = [];
      acc[manufacturer].push(item);
      return acc;
    }, {});

  const renderManufacturerGroups = (list: CartItem[]) => (
    <Stack spacing={3}>
      {Object.entries(groupByManufacturer(list)).map(([manufacturer, manufacturerItems]) => (
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

  const { inStorage, specialOrder } = partitionCartByStorage(items);

  // Only split into delivery sections when BOTH kinds are present; otherwise
  // fall back to the normal (unlabeled) cart layout.
  const showSplit = inStorage.length > 0 && specialOrder.length > 0;

  if (!showSplit) {
    return renderManufacturerGroups(items);
  }

  return (
    <Stack spacing={4}>
      {/* In-stock section */}
      <Box>
        <SectionHeader
          icon={<Inventory2Outlined fontSize="small" />}
          color="#16A34A"
          title={tCart('inStockSection')}
          delivery={tCart('inStockDelivery')}
          subtotal={getCartItemsTotal(inStorage)}
          subtotalLabel={tCart('sectionSubtotal')}
        />
        {renderManufacturerGroups(inStorage)}
      </Box>

      {/* Special-order section */}
      <Box>
        <SectionHeader
          icon={<ScheduleOutlined fontSize="small" />}
          color="#F59E0B"
          title={tCart('specialOrderSection')}
          delivery={tCart('specialOrderDelivery')}
          subtotal={getCartItemsTotal(specialOrder)}
          subtotalLabel={tCart('sectionSubtotal')}
          info={tCart('specialOrderInfo')}
        />
        {renderManufacturerGroups(specialOrder)}
      </Box>
    </Stack>
  );
}

interface SectionHeaderProps {
  icon: React.ReactElement;
  color: string;
  title: string;
  delivery: string;
  subtotal: number;
  subtotalLabel: string;
  info?: string;
}

function SectionHeader({
  icon,
  color,
  title,
  delivery,
  subtotal,
  subtotalLabel,
  info,
}: SectionHeaderProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Chip
            icon={icon}
            label={title}
            sx={{ bgcolor: color, color: 'white', fontWeight: 600, '& .MuiChip-icon': { color: 'white' } }}
          />
          <Typography variant="body2" color="text.secondary">
            {delivery}
          </Typography>
        </Stack>
        <Typography variant="body2" fontWeight={600}>
          {subtotalLabel}: {subtotal.toFixed(2)} ₾
        </Typography>
      </Box>
      {info && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {info}
        </Typography>
      )}
    </Box>
  );
}
