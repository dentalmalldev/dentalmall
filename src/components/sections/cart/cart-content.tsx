'use client';

import { Container, Typography, Box, Grid } from '@mui/material';
import { AuthGuard } from '@/components/common';
import { useCart } from '@/providers';
import { useTranslations } from 'next-intl';
import { CartItemsList } from './cart-items-list';
import { CartSummary } from './cart-summary';
import { EmptyCart } from './empty-cart';

export function CartContent() {
  return (
    <AuthGuard requireDbUser={true}>
      <CartDetails />
    </AuthGuard>
  );
}

function CartDetails() {
  const t = useTranslations();
  const { items, loading } = useCart();

  if (!loading && items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        {t('navigation.cart')} ({items.length})
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <CartItemsList />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <CartSummary />
        </Grid>
      </Grid>
    </Container>
  );
}
