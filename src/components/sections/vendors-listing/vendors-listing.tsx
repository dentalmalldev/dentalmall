'use client';

import {
  Box,
  Grid,
  Typography,
  Paper,
  Stack,
  Skeleton,
  Chip,
} from '@mui/material';
import { Store as StoreIcon, Inventory2 as ProductsIcon, LocationOn } from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

interface PublicVendor {
  id: string;
  company_name: string;
  description: string | null;
  city: string;
  email: string;
  _count: { products: number };
}

export function VendorsListing() {
  const t = useTranslations('vendorsPage');
  const locale = useLocale();
  const router = useRouter();

  const { data: vendors = [], isLoading } = useQuery<PublicVendor[]>({
    queryKey: ['vendors', 'public'],
    queryFn: async () => {
      const res = await fetch('/api/vendors?public=true');
      if (!res.ok) throw new Error('Failed to fetch vendors');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ padding: { xs: '16px', md: '28px 120px' } }}>
        <Skeleton variant="text" width={200} height={48} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rounded" height={180} sx={{ borderRadius: '16px' }} />
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
      <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>
        {t('title')}
      </Typography>

      {vendors.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            borderRadius: '16px',
            textAlign: 'center',
            backgroundColor: '#f5f6fa',
          }}
        >
          <StoreIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {t('noVendors')}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {vendors.map((vendor) => (
            <Grid key={vendor.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  },
                }}
                onClick={() => router.push(`/${locale}/vendors/${vendor.id}`)}
              >
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <StoreIcon sx={{ color: 'white' }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" fontWeight={600} noWrap>
                      {vendor.company_name}
                    </Typography>
                  </Box>
                </Stack>

                {vendor.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      flex: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {vendor.description}
                  </Typography>
                )}

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {vendor.city && (
                    <Chip
                      icon={<LocationOn sx={{ fontSize: 16 }} />}
                      label={vendor.city}
                      size="small"
                      variant="outlined"
                      sx={{ borderRadius: '8px' }}
                    />
                  )}
                  <Chip
                    icon={<ProductsIcon sx={{ fontSize: 16 }} />}
                    label={`${vendor._count.products} ${t('products')}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ borderRadius: '8px' }}
                  />
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
