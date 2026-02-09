'use client';

import {
  Box,
  Grid,
  Paper,
  Typography,
  Skeleton,
} from '@mui/material';
import {
  Inventory,
  ShoppingCart,
  AttachMoney,
  Warning,
  TrendingUp,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/providers';
import { vendorService, VendorDashboardStats } from '@/services';

interface VendorOverviewProps {
  vendorId?: string;
}

export function VendorOverview({ vendorId }: VendorOverviewProps) {
  const t = useTranslations('vendorDashboard');
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<VendorDashboardStats>({
    queryKey: ['vendor', 'dashboard', vendorId],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      return vendorService.getDashboardStats(user, vendorId);
    },
    enabled: !!user,
  });

  const statCards = [
    {
      label: t('totalProducts'),
      value: stats?.totalProducts ?? 0,
      icon: <Inventory sx={{ fontSize: 40 }} />,
      color: '#5B6ECD',
    },
    {
      label: t('totalOrders'),
      value: stats?.totalOrders ?? 0,
      icon: <ShoppingCart sx={{ fontSize: 40 }} />,
      color: '#01DBE6',
    },
    {
      label: t('totalRevenue'),
      value: `₾${(stats?.totalRevenue ?? 0).toFixed(2)}`,
      icon: <AttachMoney sx={{ fontSize: 40 }} />,
      color: '#4CAF50',
    },
    {
      label: t('outOfStock'),
      value: stats?.outOfStockProducts ?? 0,
      icon: <Warning sx={{ fontSize: 40 }} />,
      color: (stats?.outOfStockProducts ?? 0) > 0 ? '#FF6B6B' : '#A8B0BA',
    },
    {
      label: t('recentOrders'),
      value: stats?.recentOrders ?? 0,
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      color: '#9292FF',
    },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        {t('overview')}
      </Typography>

      <Grid container spacing={3}>
        {statCards.map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, md: 4 }}>
            {isLoading ? (
              <Skeleton variant="rounded" height={160} sx={{ borderRadius: '16px' }} />
            ) : (
              <Paper
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-2px)' },
                }}
              >
                <Box sx={{ color: card.color, mb: 1 }}>{card.icon}</Box>
                <Typography variant="h4" fontWeight={700}>
                  {card.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {card.label}
                </Typography>
              </Paper>
            )}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
