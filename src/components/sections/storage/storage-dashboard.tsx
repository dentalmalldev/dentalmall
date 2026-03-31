'use client';

import { Box, Grid, Paper, Typography, Button, Skeleton, Stack } from '@mui/material';
import {
  Inventory,
  LocalShipping,
  CheckCircle,
  ArrowForward,
  DeliveryDining,
} from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';

interface Stats {
  processing: number;
  ready: number;
  out_for_delivery: number;
  delivered_today: number;
  total_delivered: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  action?: { label: string; onClick: () => void };
}

function StatCard({ title, value, subtitle, icon, color, loading, action }: StatCardProps) {
  return (
    <Paper sx={{ p: 3, borderRadius: '16px', height: '100%' }} elevation={0}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          {loading ? (
            <Skeleton width={80} height={40} />
          ) : (
            <Typography variant="h4" fontWeight={700}>
              {value}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          {action && (
            <Button
              size="small"
              endIcon={<ArrowForward fontSize="small" />}
              onClick={action.onClick}
              sx={{ mt: 1, p: 0, textTransform: 'none' }}
            >
              {action.label}
            </Button>
          )}
        </Box>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            bgcolor: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
          }}
        >
          {icon}
        </Box>
      </Stack>
    </Paper>
  );
}

export function StorageDashboard() {
  const t = useTranslations('storage');
  const locale = useLocale();
  const router = useRouter();

  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['storage-stats'],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/storage/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700}>
          {t('dashboardTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('dashboardSubtitle')}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title={t('toPrepare')}
            value={stats?.processing ?? 0}
            subtitle={t('ordersWaiting')}
            icon={<Inventory />}
            color="#ef4444"
            loading={isLoading}
            action={{
              label: t('viewAll'),
              onClick: () => router.push(`/${locale}/storage/orders?tab=to_prepare`),
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title={t('readyForDelivery')}
            value={stats?.ready ?? 0}
            subtitle={t('readyToShip')}
            icon={<LocalShipping />}
            color="#f59e0b"
            loading={isLoading}
            action={{
              label: t('viewAll'),
              onClick: () => router.push(`/${locale}/storage/orders?tab=ready`),
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title={t('outForDelivery')}
            value={stats?.out_for_delivery ?? 0}
            subtitle={t('inTransit')}
            icon={<DeliveryDining />}
            color="#6366f1"
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title={t('deliveredToday')}
            value={stats?.delivered_today ?? 0}
            subtitle={`${stats?.total_delivered ?? 0} ${t('totalDelivered')}`}
            icon={<CheckCircle />}
            color="#22c55e"
            loading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Quick action: To Prepare */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          {t('quickActions')}
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: '16px',
                cursor: 'pointer',
                border: '2px solid',
                borderColor: 'error.light',
                transition: 'all 0.2s',
                '&:hover': { borderColor: 'error.main', transform: 'translateY(-2px)' },
              }}
              elevation={0}
              onClick={() => router.push(`/${locale}/storage/orders?tab=to_prepare`)}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ color: 'error.main' }}>
                  <Inventory fontSize="large" />
                </Box>
                <Box>
                  <Typography fontWeight={600}>{t('toPrepareTitle')}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('toPrepareDesc')}
                  </Typography>
                  {!isLoading && (
                    <Typography variant="h6" fontWeight={700} color="error.main">
                      {stats?.processing ?? 0}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: '16px',
                cursor: 'pointer',
                border: '2px solid',
                borderColor: 'warning.light',
                transition: 'all 0.2s',
                '&:hover': { borderColor: 'warning.main', transform: 'translateY(-2px)' },
              }}
              elevation={0}
              onClick={() => router.push(`/${locale}/storage/orders?tab=ready`)}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ color: 'warning.main' }}>
                  <LocalShipping fontSize="large" />
                </Box>
                <Box>
                  <Typography fontWeight={600}>{t('readyToShipTitle')}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('readyToShipDesc')}
                  </Typography>
                  {!isLoading && (
                    <Typography variant="h6" fontWeight={700} color="warning.main">
                      {stats?.ready ?? 0}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
