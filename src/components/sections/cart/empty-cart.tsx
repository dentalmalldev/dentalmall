'use client';

import { Container, Typography, Box, Button } from '@mui/material';
import { useLocale } from 'next-intl';
import Link from 'next/link';

export function EmptyCart() {
  const locale = useLocale();

  const translations = {
    ka: {
      title: 'თქვენი კალათა ცარიელია',
      description: 'დაამატეთ პროდუქტები კალათაში შესყიდვის დასაწყებად',
      browseProducts: 'პროდუქტების ნახვა',
    },
    en: {
      title: 'Your cart is empty',
      description: 'Add products to your cart to start shopping',
      browseProducts: 'Browse Products',
    },
  };

  const t = translations[locale as 'ka' | 'en'] || translations.en;

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Box sx={{ mb: 3 }}>
          <CartEmptyIcon />
        </Box>
        <Typography variant="h4" gutterBottom>
          {t.title}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          {t.description}
        </Typography>
        <Button
          component={Link}
          href={`/${locale}/categories`}
          variant="contained"
          size="large"
        >
          {t.browseProducts}
        </Button>
      </Box>
    </Container>
  );
}

function CartEmptyIcon() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z"
        stroke="#9292FF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z"
        stroke="#9292FF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6"
        stroke="#9292FF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
