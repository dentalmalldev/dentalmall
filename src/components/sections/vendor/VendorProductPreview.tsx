'use client';

import { Box, Grid, Stack, Typography, Button, Skeleton } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ProductCard } from '@/components/common';
import { useProducts } from '@/hooks';
import { getProductDisplayPricing } from '@/lib/product-pricing';

const PREVIEW_LIMIT = 12;

export function VendorProductPreview({ vendorId }: { vendorId: string }) {
  const t = useTranslations('vendorDetail');
  const locale = useLocale();

  const { data, isLoading } = useProducts({
    vendor_id: vendorId,
    limit: PREVIEW_LIMIT,
    sort: 'newest',
  });

  const products = data?.data || [];
  const total = data?.pagination?.total ?? 0;
  // "See all" lands on the global shop with this vendor pre-filtered (Ticket #47 format).
  const seeAllHref = `/${locale}/products?vendor=${vendorId}`;

  const getProductName = (p: { name: string; name_ka: string }) =>
    locale === 'ka' ? p.name_ka : p.name;

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>
          {t('products')}
        </Typography>
        {!isLoading && total > 0 && (
          <Button
            component={Link}
            href={seeAllHref}
            endIcon={<ArrowForward />}
            sx={{ textTransform: 'none' }}
          >
            {t('seeAll')}
          </Button>
        )}
      </Stack>

      {isLoading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Skeleton variant="rounded" height={350} />
            </Grid>
          ))}
        </Grid>
      ) : products.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          {t('noProducts')}
        </Typography>
      ) : (
        <>
          <Grid container spacing={3}>
            {products.map((product) => {
              const pricing = getProductDisplayPricing(product);
              return (
                <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <ProductCard
                    id={product.id}
                    name={getProductName(product)}
                    manufacturer={product.category?.name || ''}
                    image={product?.media?.[0]?.url || '/logos/placeholder.jpg'}
                    price={pricing.minPrice}
                    originalPrice={pricing.minOriginalPrice ?? undefined}
                    discount={pricing.discount ?? undefined}
                    fromLabel={pricing.hasVariants}
                    variantTypes={product.variant_types}
                    inStorageStock={product.in_storage_stock}
                  />
                </Grid>
              );
            })}
          </Grid>
          {total > products.length && (
            <Stack alignItems="center" sx={{ mt: 4 }}>
              <Button
                component={Link}
                href={seeAllHref}
                variant="contained"
                endIcon={<ArrowForward />}
                sx={{ textTransform: 'none' }}
              >
                {t('seeAllCount', { count: total })}
              </Button>
            </Stack>
          )}
        </>
      )}
    </Box>
  );
}
