'use client';

import { Box, Grid, Paper, Typography, Button, Skeleton, Stack } from '@mui/material';
import {
  CheckCircle,
  Pending,
  TrendingUp,
  Warning,
  ArrowForward,
} from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';

interface Stats {
  today_paid: number;
  pending_invoices: number;
  month_revenue: number;
  failed_payments: number;
  card_today: number;
  invoice_today: number;
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

export function AccountantDashboard() {
  const t = useTranslations('accountant');
  const locale = useLocale();
  const router = useRouter();

  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['accountant-stats'],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/accountant/stats', {
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
            title={t('todayPaid')}
            value={stats?.today_paid ?? 0}
            subtitle={t('ordersVerifiedToday')}
            icon={<CheckCircle />}
            color="#22c55e"
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title={t('pendingInvoices')}
            value={stats?.pending_invoices ?? 0}
            subtitle={t('awaitingVerification')}
            icon={<Pending />}
            color="#f59e0b"
            loading={isLoading}
            action={{
              label: t('viewPending'),
              onClick: () => router.push(`/${locale}/accountant/orders?tab=pending`),
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title={t('monthRevenue')}
            value={`₾${stats?.month_revenue?.toFixed(2) ?? '0.00'}`}
            subtitle={t('paidOrdersThisMonth')}
            icon={<TrendingUp />}
            color="#6366f1"
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title={t('failedPayments')}
            value={stats?.failed_payments ?? 0}
            subtitle={t('requiresAttention')}
            icon={<Warning />}
            color="#ef4444"
            loading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Quick links */}
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
                borderColor: 'warning.light',
                transition: 'all 0.2s',
                '&:hover': { borderColor: 'warning.main', transform: 'translateY(-2px)' },
              }}
              elevation={0}
              onClick={() => router.push(`/${locale}/accountant/orders?tab=pending`)}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ color: 'warning.main' }}>
                  <Pending fontSize="large" />
                </Box>
                <Box>
                  <Typography fontWeight={600}>{t('pendingInvoicesTitle')}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('pendingInvoicesDesc')}
                  </Typography>
                  {!isLoading && (
                    <Typography variant="h6" fontWeight={700} color="warning.main">
                      {stats?.pending_invoices ?? 0}
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
                borderColor: 'divider',
                transition: 'all 0.2s',
                '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)' },
              }}
              elevation={0}
              onClick={() => router.push(`/${locale}/accountant/orders`)}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ color: 'primary.main' }}>
                  <CheckCircle fontSize="large" />
                </Box>
                <Box>
                  <Typography fontWeight={600}>{t('allOrdersTitle')}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('allOrdersDesc')}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
