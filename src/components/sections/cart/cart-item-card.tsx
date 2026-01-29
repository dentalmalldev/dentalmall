'use client';

import {
  Box,
  Typography,
  IconButton,
  Checkbox,
  Stack,
  Chip,
} from '@mui/material';
import { useCart } from '@/providers';
import { useLocale, useTranslations } from 'next-intl';
import { CartItem } from '@/types';
import Image from 'next/image';
import { useState } from 'react';

interface CartItemCardProps {
  item: CartItem;
}

export function CartItemCard({ item }: CartItemCardProps) {
  const { updateQuantity, removeFromCart, loading } = useCart();
  const locale = useLocale();
  const t = useTranslations('productsSection');
  const [selected, setSelected] = useState(true);

  const { product, quantity } = item;
  const price = parseFloat(product.price);
  const salePrice = product.sale_price ? parseFloat(product.sale_price) : null;
  const hasDiscount = salePrice !== null && salePrice < price;
  const discountPercent = hasDiscount ? Math.round((1 - salePrice / price) * 100) : 0;

  const displayPrice = salePrice ?? price;
  const productName = locale === 'ka' ? product.name_ka : product.name;

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;
    await updateQuantity(item.id, newQuantity);
  };

  const handleRemove = async () => {
    await removeFromCart(item.id);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 3 }}>
      <Checkbox
        checked={selected}
        onChange={(e) => setSelected(e.target.checked)}
        sx={{ mt: 2 }}
      />

      <Box
        sx={{
          width: 100,
          height: 100,
          position: 'relative',
          borderRadius: 2,
          overflow: 'hidden',
          flexShrink: 0,
          bgcolor: 'grey.100',
        }}
      >
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={productName}
            fill
            style={{ objectFit: 'cover' }}
          />
        )}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h6" fontWeight={600} noWrap>
          {productName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('manufacturer')}: {product.manufacturer || '-'}
        </Typography>

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
          <Typography variant="h6" fontWeight={700} color="primary">
            {displayPrice}₾
          </Typography>
          {hasDiscount && (
            <>
              <Typography
                variant="body2"
                sx={{ textDecoration: 'line-through', color: 'text.disabled' }}
              >
                {price}₾
              </Typography>
              <Chip
                label={`-${discountPercent}%`}
                size="small"
                sx={{
                  bgcolor: 'secondary.main',
                  color: 'white',
                  fontWeight: 600,
                  height: 24,
                }}
              />
            </>
          )}
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <IconButton
              size="small"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={loading || quantity <= 1}
              sx={{ borderRadius: 0 }}
            >
              <Typography variant="h6">−</Typography>
            </IconButton>
            <Typography
              sx={{
                px: 2,
                minWidth: 40,
                textAlign: 'center',
                fontWeight: 600,
              }}
            >
              {quantity}
            </Typography>
            <IconButton
              size="small"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={loading}
              sx={{ borderRadius: 0 }}
            >
              <Typography variant="h6">+</Typography>
            </IconButton>
          </Box>
        </Stack>
      </Box>

      <IconButton
        onClick={handleRemove}
        disabled={loading}
        sx={{ color: 'primary.main' }}
      >
        <DeleteIcon />
      </IconButton>
    </Box>
  );
}

function DeleteIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 6H5H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
