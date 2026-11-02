'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Stack,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { FavoriteBorder, ShoppingCart } from '@mui/icons-material';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth, useCart, useFavorites, useSnackbar } from '@/providers';
import { favoritesService } from '@/services';
import { getProductDisplayPricing, hasProductVariants } from '@/lib/product-pricing';
import { TrashIcon } from '@/icons';
import { colors } from '@/theme';
import type { FavoriteCartOutcome, FavoriteCartResult, FavoriteItem } from '@/types/models';

const OUTCOME_COLOR: Record<FavoriteCartOutcome, 'success' | 'info' | 'warning' | 'error'> = {
  added: 'success',
  already_in_cart: 'success',
  needs_variant: 'info',
  out_of_stock: 'error',
  stock_limit: 'warning',
  unavailable: 'error',
};

// Stock as the customer sees it: a product with variants is out of stock only
// when every option is. Add-to-cart rejects stock 0 whatever in_storage_stock
// says, so special-order items at 0 are out of stock too.
function isOutOfStock(item: FavoriteItem) {
  const { product } = item;
  if (hasProductVariants(product)) {
    return product.variant_types.every((vt) => (vt.options ?? []).every((o) => o.stock <= 0));
  }
  return product.stock <= 0;
}

export function MyFavorites() {
  const t = useTranslations('favorites');
  const tp = useTranslations('productsSection');
  const tc = useTranslations('cart');
  const tDetail = useTranslations('productDetail');
  const locale = useLocale();
  const { user } = useAuth();
  const { items, loading, removeFavorite } = useFavorites();
  const { addToCart, refreshCart } = useCart();
  const { showSnackbar } = useSnackbar();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [results, setResults] = useState<FavoriteCartResult[] | null>(null);

  const getName = (p: { name: string; name_ka: string }) => (locale === 'ka' ? p.name_ka : p.name);

  // Only products without variants and with stock can go in by one click.
  const bulkAddable = items.filter((f) => !hasProductVariants(f.product) && !isOutOfStock(f));

  const handleAddToCart = async (productId: string) => {
    setBusyId(productId);
    try {
      await addToCart(productId, 1);
      showSnackbar(tp('addedToCart'));
    } catch {
      showSnackbar(tp('addToCartError'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (productId: string) => {
    setBusyId(productId);
    try {
      await removeFavorite(productId);
      showSnackbar(t('removed'));
    } catch {
      showSnackbar(t('error'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleAddAll = async () => {
    if (!user) return;
    setBulkBusy(true);
    try {
      // Every row on screen goes to the server, which reports per product —
      // including the ones that need a variant or are out of stock.
      const outcome = await favoritesService.addAllToCart(user, items.map((f) => f.product_id));
      setResults(outcome);
      await refreshCart();
    } catch {
      showSnackbar(tp('addToCartError'), 'error');
    } finally {
      setBulkBusy(false);
    }
  };

  if (loading && items.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const addedCount = results?.filter((r) => r.outcome === 'added' || r.outcome === 'already_in_cart').length ?? 0;

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" fontWeight={600}>
          {t('title')}
        </Typography>
        {items.length > 0 && (
          <Button
            variant="contained"
            startIcon={bulkBusy ? <CircularProgress size={18} color="inherit" /> : <ShoppingCart />}
            onClick={handleAddAll}
            disabled={bulkBusy || bulkAddable.length === 0}
            sx={{
              borderRadius: '100px',
              textTransform: 'none',
              fontWeight: 600,
              backgroundColor: colors.accent.main,
              '&:hover': { backgroundColor: colors.accent.hover },
            }}
          >
            {t('addAll')}
          </Button>
        )}
      </Stack>

      {items.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            borderRadius: '16px',
            textAlign: 'center',
            backgroundColor: '#f5f6fa',
          }}
        >
          <FavoriteBorder sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('empty')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('emptyHint')}
          </Typography>
          <Button
            component={Link}
            href={`/${locale}/products`}
            variant="contained"
            sx={{
              borderRadius: '100px',
              textTransform: 'none',
              backgroundColor: colors.accent.main,
              '&:hover': { backgroundColor: colors.accent.hover },
            }}
          >
            {t('goToShop')}
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {items.map((item) => {
            const { product } = item;
            const productUrl = `/${locale}/products/${product.id}`;
            const pricing = getProductDisplayPricing(product);
            const outOfStock = isOutOfStock(item);
            const busy = busyId === product.id;
            const image = product.media[0]?.url;

            return (
              <Paper
                key={item.id}
                variant="outlined"
                sx={{ p: 2, borderRadius: '16px', opacity: outOfStock ? 0.75 : 1 }}
              >
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box
                    component={Link}
                    href={productUrl}
                    sx={{
                      position: 'relative',
                      width: { xs: 72, sm: 88 },
                      height: { xs: 72, sm: 88 },
                      flexShrink: 0,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      backgroundColor: '#F5F6FF',
                    }}
                  >
                    <Image
                      src={image || '/logos/placeholder.jpg'}
                      alt={getName(product)}
                      fill
                      sizes="88px"
                      style={{ objectFit: 'cover' }}
                    />
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      component={Link}
                      href={productUrl}
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        overflowWrap: 'anywhere',
                        fontWeight: 600,
                        color: colors.text.primary,
                        textDecoration: 'none',
                        '&:hover': { color: colors.accent.main },
                      }}
                    >
                      {getName(product)}
                    </Typography>

                    <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mt: 0.5 }}>
                      {/* Same price display as ProductCard, so a product reads alike in both places. */}
                      <Typography fontWeight={700} color={colors.text.primary}>
                        {pricing.hasVariants ? tp('priceFrom', { price: pricing.minPrice }) : `${pricing.minPrice}₾`}
                      </Typography>
                      {pricing.minOriginalPrice !== null && (
                        <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                          {pricing.hasVariants
                            ? tp('priceFrom', { price: pricing.minOriginalPrice })
                            : `${pricing.minOriginalPrice}₾`}
                        </Typography>
                      )}
                    </Stack>

                    <Box sx={{ mt: 0.75 }}>
                      {outOfStock ? (
                        <Chip size="small" color="error" variant="outlined" label={tDetail('outOfStock')} />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          {product.in_storage_stock ? tc('inStockDelivery') : tc('specialOrderDelivery')}
                        </Typography>
                      )}
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                      {pricing.hasVariants ? (
                        // A variant has to be chosen first, so this one opens the product.
                        <Button
                          component={Link}
                          href={productUrl}
                          size="small"
                          variant="outlined"
                          disabled={outOfStock}
                          sx={{ borderRadius: '100px', textTransform: 'none' }}
                        >
                          {t('chooseVariant')}
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleAddToCart(product.id)}
                          disabled={outOfStock || busy}
                          startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <ShoppingCart fontSize="small" />}
                          sx={{
                            borderRadius: '100px',
                            textTransform: 'none',
                            backgroundColor: colors.accent.main,
                            '&:hover': { backgroundColor: colors.accent.hover },
                          }}
                        >
                          {tp('addToCart')}
                        </Button>
                      )}
                      <IconButton
                        aria-label={t('remove')}
                        onClick={() => handleRemove(product.id)}
                        disabled={busy}
                        sx={{ color: 'text.secondary' }}
                      >
                        <TrashIcon />
                      </IconButton>
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* What "add all" did, product by product */}
      <Dialog open={results !== null} onClose={() => setResults(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t('resultsTitle', { added: addedCount, total: results?.length ?? 0 })}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            {results?.map((r) => (
              <Stack
                key={r.product_id}
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1}
              >
                <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
                  {getName(r)}
                </Typography>
                <Chip
                  size="small"
                  color={OUTCOME_COLOR[r.outcome]}
                  variant="outlined"
                  label={t(`outcome.${r.outcome}`)}
                  sx={{ flexShrink: 0 }}
                />
              </Stack>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setResults(null)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
            {t('close')}
          </Button>
          <Button
            component={Link}
            href={`/${locale}/cart`}
            variant="contained"
            sx={{
              textTransform: 'none',
              backgroundColor: colors.accent.main,
              '&:hover': { backgroundColor: colors.accent.hover },
            }}
          >
            {t('goToCart')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
