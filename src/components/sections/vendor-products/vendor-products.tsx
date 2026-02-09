'use client';

import { Box, Grid, Typography, Skeleton, Stack, Chip } from '@mui/material';
import { Store as StoreIcon } from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';
import { ProductCard } from '@/components/common';
import { useProducts } from '@/hooks';
import ProductNotFound from '@/components/common/product-not-found/product-not-found';
import { useQuery } from '@tanstack/react-query';
import { Vendor } from '@/types/models';

interface VendorProductsProps {
  vendorId: string;
}

export function VendorProducts({ vendorId }: VendorProductsProps) {
  const { data: productsData, isLoading: productsLoading } = useProducts({
    vendor_id: vendorId,
    limit: 50,
  });
  const t = useTranslations('vendorProducts');
  const locale = useLocale();

  const { data: vendor, isLoading: vendorLoading } = useQuery<Vendor>({
    queryKey: ['vendor', vendorId],
    queryFn: async () => {
      const res = await fetch(`/api/vendors/${vendorId}`);
      if (!res.ok) throw new Error('Failed to fetch vendor');
      return res.json();
    },
  });

  const getProductName = (product: { name: string; name_ka: string }) =>
    locale === 'ka' ? product.name_ka : product.name;

  const products = productsData?.data || [];
  const isLoading = productsLoading || vendorLoading;

  if (isLoading) {
    return (
      <Box sx={{ padding: { xs: '16px', md: '28px 120px' } }}>
        <Skeleton variant="text" width={300} height={40} />
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Skeleton variant="rounded" height={350} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        padding: { xs: '16px', md: '28px 120px' },
        paddingBottom: { xs: '100px', md: '40px' },
      }}
    >
      {/* Vendor Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <StoreIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" fontWeight={700}>
            {vendor?.company_name || t('vendor')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('productsCount', { count: products.length })}
          </Typography>
        </Box>
      </Stack>

      {/* Products Grid */}
      {products.length > 0 ? (
        <Grid container spacing={3}>
          {products.map((product) => {
            const price = parseFloat(product.price);
            const salePrice = product.sale_price ? parseFloat(product.sale_price) : undefined;
            const discount = salePrice ? Math.round((1 - salePrice / price) * 100) : undefined;

            return (
              <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <ProductCard
                  id={product.id}
                  name={getProductName(product)}
                  manufacturer={product.category?.name || ''}
                  image={product?.media ? product.media[0]?.url : '/logos/products/placeholder.jpg'}
                  price={salePrice || price}
                  originalPrice={salePrice ? price : undefined}
                  discount={discount}
                />
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <ProductNotFound />
      )}
    </Box>
  );
}
