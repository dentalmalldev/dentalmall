'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, CircularProgress, Grid, Paper, Typography } from '@mui/material';
import { useLocale, useTranslations } from 'next-intl';
import { ProductCard } from '@/components/common';
import { usePurchasedProducts } from '@/hooks';
import { getProductDisplayPricing, getVariantOptionPricing } from '@/lib/product-pricing';
import type { PurchasedProductEntry } from '@/types/models';
import { PurchaseAgainDialog } from './purchase-again-dialog';

// Price and label for one entry: the bought variant's own current price, or
// the product's display price when there's no (longer a) variant.
function getEntryCardPricing(entry: PurchasedProductEntry, locale: string) {
  const { product } = entry;
  const option = entry.variant_option_id
    ? product.variant_types.flatMap((vt) => vt.options ?? []).find((o) => o.id === entry.variant_option_id)
    : undefined;

  if (option) {
    const pricing = getVariantOptionPricing(option);
    return {
      price: pricing.price,
      originalPrice: pricing.originalPrice ?? undefined,
      discount: pricing.discount || undefined,
      fromLabel: false,
      variantName: locale === 'ka' ? option.name_ka : option.name,
    };
  }

  const pricing = getProductDisplayPricing(product);
  return {
    price: pricing.minPrice,
    originalPrice: pricing.minOriginalPrice ?? undefined,
    discount: pricing.discount || undefined,
    fromLabel: pricing.hasVariants,
    variantName: undefined,
  };
}

export function PurchasedProducts() {
  const t = useTranslations('purchasedProducts');
  const locale = useLocale();
  const {
    data,
    isPending,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = usePurchasedProducts();
  const [dialogEntry, setDialogEntry] = useState<PurchasedProductEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  // Bumped on every open so the dialog starts fresh (quantity 1, the bought
  // variant) even when the same card is opened again.
  const [dialogSession, setDialogSession] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Pages don't overlap, but a delivery landing mid-scroll can re-rank an
  // entry into a later page; keep its first appearance only.
  const entries = useMemo(() => {
    const seen = new Set<string>();
    return (data?.pages ?? [])
      .flatMap((page) => page.items)
      .filter((entry) => {
        if (seen.has(entry.key)) return false;
        seen.add(entry.key);
        return true;
      });
  }, [data]);

  // Load the next page when the end of the list comes into view. Stops once
  // the API returns no cursor, and after a failed page (no retry loop) until
  // the customer retries.
  const canAutoLoad = !!hasNextPage && !isFetchingNextPage && !isFetchNextPageError;
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !canAutoLoad) return;
    const observer = new IntersectionObserver(
      (records) => {
        if (records.some((r) => r.isIntersecting)) fetchNextPage({ cancelRefetch: false });
      },
      { rootMargin: '300px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [canAutoLoad, fetchNextPage]);

  const openDialog = (entry: PurchasedProductEntry) => {
    setDialogEntry(entry);
    setDialogSession((n) => n + 1);
    setDialogOpen(true);
  };

  const title = (
    <Typography variant="h4" fontWeight={600} sx={{ mb: 3 }}>
      {t('title')}
    </Typography>
  );

  if (isPending) {
    return (
      <Box>
        {title}
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (isError && entries.length === 0) {
    return (
      <Box>
        {title}
        <Paper sx={{ p: 4, borderRadius: '16px', textAlign: 'center', backgroundColor: '#f5f6fa' }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {t('loadError')}
          </Typography>
          <Button variant="outlined" onClick={() => refetch()} sx={{ borderRadius: '100px', textTransform: 'none' }}>
            {t('retry')}
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      {title}

      {entries.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: '16px', textAlign: 'center', backgroundColor: '#f5f6fa' }}>
          <Typography variant="h6" color="text.secondary">
            {t('empty')}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {entries.map((entry) => {
            const { product } = entry;
            const pricing = getEntryCardPricing(entry, locale);
            return (
              <Grid key={entry.key} size={{ xs: 6, md: 4 }}>
                <ProductCard
                  id={product.id}
                  name={locale === 'ka' ? product.name_ka : product.name}
                  manufacturer={product.category?.name || ''}
                  image={product.media[0]?.url || '/logos/placeholder.jpg'}
                  price={pricing.price}
                  originalPrice={pricing.originalPrice}
                  discount={pricing.discount}
                  fromLabel={pricing.fromLabel}
                  variantTypes={product.variant_types}
                  inStorageStock={product.in_storage_stock}
                  variantName={pricing.variantName}
                  extraInfo={
                    <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#3E4388' }}>
                      {t('purchasedQuantity', { count: entry.total_quantity })}
                    </Typography>
                  }
                  onAddToCart={() => openDialog(entry)}
                />
              </Grid>
            );
          })}
        </Grid>
      )}

      <Box ref={sentinelRef} sx={{ height: 1 }} />
      {isFetchingNextPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      )}
      {isFetchNextPageError && (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t('loadError')}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => fetchNextPage()}
            sx={{ borderRadius: '100px', textTransform: 'none' }}
          >
            {t('retry')}
          </Button>
        </Box>
      )}

      {dialogEntry && (
        <PurchaseAgainDialog
          key={dialogSession}
          entry={dialogEntry}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </Box>
  );
}
