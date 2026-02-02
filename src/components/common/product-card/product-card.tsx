'use client';

import { Box, Typography, Button, Chip, Stack, CircularProgress } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useCart, useAuth } from '@/providers';
import { useState } from 'react';

export interface ProductCardProps {
  id: string;
  name: string;
  manufacturer: string;
  image: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  onAuthRequired?: () => void;
}

export function ProductCard({
  id,
  name,
  manufacturer,
  image,
  price,
  originalPrice,
  discount,
  onAuthRequired,
}: ProductCardProps) {
  const t = useTranslations('productsSection');
  const locale = useLocale();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);

  const productUrl = `/${locale}/products/${id}`;

  const handleAddToCart = async () => {
    if (!user) {
      onAuthRequired?.();
      return;
    }

    setLoading(true);
    try {
      console.log('ID:', id)
      await addToCart(id);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
      }}
    >
      {/* Product Image */}
      <Link href={productUrl} style={{ textDecoration: 'none' }}>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '250px',
            backgroundColor: '#F5F6FF',
            borderRadius: '12px',
            cursor: 'pointer',
          }}
        >
          <Image
            src={image}
            alt={name}
            fill
            style={{ objectFit: 'cover' }}
          />
          {discount && (
            <Chip
              label={`-${discount}%`}
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                backgroundColor: '#5B6ECD',
                color: 'white',
                fontWeight: 600,
                fontSize: '12px',
              }}
            />
          )}
        </Box>
      </Link>

      {/* Product Info */}
      <Box sx={{ padding: 2 }}>
        <Link href={productUrl} style={{ textDecoration: 'none' }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#3E4388',
              marginBottom: 0.5,
              cursor: 'pointer',
              '&:hover': {
                color: '#5B6ECD',
              },
            }}
          >
            {name}
          </Typography>
        </Link>

        <Typography
          variant="body2"
          sx={{
            fontSize: '12px',
            color: '#3E438899',
            marginBottom: 2,
          }}
        >
          {t('manufacturer')}: {manufacturer}
        </Typography>

        {/* Price */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ marginBottom: 2 }}>
          <Typography
            variant="h5"
            sx={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#3E4388',
            }}
          >
            {price}₾
          </Typography>
          {originalPrice && (
            <Typography
              variant="body2"
              sx={{
                fontSize: '14px',
                color: '#3E438866',
                textDecoration: 'line-through',
              }}
            >
              {originalPrice}₾
            </Typography>
          )}
        </Stack>

        {/* Add to Cart Button */}
        <Button
          variant="contained"
          fullWidth
          onClick={handleAddToCart}
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38754 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6M10 21C10 21.5523 9.55228 22 9 22C8.44772 22 8 21.5523 8 21C8 20.4477 8.44772 20 9 20C9.55228 20 10 20.4477 10 21ZM21 21C21 21.5523 20.5523 22 20 22C19.4477 22 19 21.5523 19 21C19 20.4477 19.4477 20 20 20C20.5523 20 21 20.4477 21 21Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )
          }
          sx={{
            borderRadius: '100px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 600,
            textTransform: 'none',
            backgroundColor: '#5B6ECD',
            '&:hover': {
              backgroundColor: '#4A5BC0',
            },
          }}
        >
          {t('addToCart')}
        </Button>
      </Box>
    </Box>
  );
}
