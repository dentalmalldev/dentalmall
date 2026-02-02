'use client';

import {
  Box,
  Paper,
  Typography,
  Stack,
  Grid,
} from '@mui/material';
import {
  LocalHospital,
  Store,
  Inventory,
  People,
  ShoppingCart,
  TrendingUp,
} from '@mui/icons-material';
import { useAuth } from '@/providers';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { auth } from '@/lib/firebase';

export function AdminDashboardContent() {
  const t = useTranslations('admin');
  const { dbUser } = useAuth();

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();

      const [productsRes, clinicRequestsRes, vendorRequestsRes] = await Promise.all([
        fetch('/api/admin/products?limit=1', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/clinic-requests?status=PENDING', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/vendor-requests?status=PENDING', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const products = await productsRes.json();
      const clinicRequests = await clinicRequestsRes.json();
      const vendorRequests = await vendorRequestsRes.json();

      return {
        products: products.total || 0,
        pendingClinicRequests: Array.isArray(clinicRequests) ? clinicRequests.length : 0,
        pendingVendorRequests: Array.isArray(vendorRequests) ? vendorRequests.length : 0,
      };
    },
  });

  const statCards = [
    {
      label: t('products'),
      value: stats?.products || 0,
      icon: <Inventory sx={{ fontSize: 32 }} />,
      color: '#5B6ECD',
    },
    {
      label: 'Orders',
      value: 0,
      icon: <ShoppingCart sx={{ fontSize: 32 }} />,
      color: '#9292FF',
    },
    {
      label: 'Users',
      value: 0,
      icon: <People sx={{ fontSize: 32 }} />,
      color: '#01DBE6',
    },
    {
      label: t('pendingRequests'),
      value: (stats?.pendingClinicRequests || 0) + (stats?.pendingVendorRequests || 0),
      icon: <TrendingUp sx={{ fontSize: 32 }} />,
      color: '#FF6B6B',
    },
  ];

  return (
    <Box>
      {/* Welcome Section */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          mb: 4,
        }}
      >
        <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
          {t('welcome')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('loggedInAs')}: <strong>{dbUser?.email}</strong>
        </Typography>
      </Paper>

      {/* Stats Grid */}
      <Grid container spacing={3} mb={4}>
        {statCards.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                height: '100%',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    bgcolor: `${stat.color}15`,
                    color: stat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
              <LocalHospital color="primary" />
              <Typography variant="h6" fontWeight={600}>
                {t('clinicRequests')}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" mb={1}>
              {t('pendingRequests')}: <strong>{stats?.pendingClinicRequests || 0}</strong>
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
              <Store color="secondary" />
              <Typography variant="h6" fontWeight={600}>
                {t('vendorRequests')}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" mb={1}>
              {t('pendingRequests')}: <strong>{stats?.pendingVendorRequests || 0}</strong>
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
