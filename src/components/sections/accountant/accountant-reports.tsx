'use client';

import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Skeleton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from '@mui/material';
import { Download, TrendingUp, Receipt, CreditCard } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { auth } from '@/lib/firebase';

interface ReportData {
  summary: {
    total_orders: number;
    total_revenue: number;
    total_subtotal: number;
    total_discount: number;
    total_delivery: number;
  };
  by_payment_method: { method: string; count: number; total: number }[];
  by_payment_status: { status: string; count: number; total: number }[];
  by_order_status: { status: string; count: number }[];
  daily_revenue: { day: string; revenue: number; count: number }[];
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PAID: '#22c55e',
  INVOICE_SENT: '#f59e0b',
  PENDING: '#94a3b8',
  FAILED: '#ef4444',
  REFUNDED: '#6366f1',
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#3b82f6',
  PROCESSING: '#8b5cf6',
  SHIPPED: '#06b6d4',
  DELIVERED: '#22c55e',
  CANCELLED: '#ef4444',
};

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <Box sx={{ flex: 1, height: 8, bgcolor: 'grey.100', borderRadius: 4, overflow: 'hidden' }}>
      <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: color, borderRadius: 4, transition: 'width 0.4s' }} />
    </Box>
  );
}

function SimpleLineChart({ data }: { data: { day: string; revenue: number }[] }) {
  if (!data.length) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180 }}>
      <Typography color="text.secondary" variant="body2">No data for this period</Typography>
    </Box>
  );

  const max = Math.max(...data.map((d) => d.revenue), 1);
  const width = 600;
  const height = 160;
  const pad = { top: 10, right: 10, bottom: 30, left: 50 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const points = data.map((d, i) => ({
    x: pad.left + (i / Math.max(data.length - 1, 1)) * innerW,
    y: pad.top + innerH - (d.revenue / max) * innerH,
    ...d,
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
  const area = [
    `M${points[0].x},${pad.top + innerH}`,
    ...points.map((p) => `L${p.x},${p.y}`),
    `L${points[points.length - 1].x},${pad.top + innerH}`,
    'Z',
  ].join(' ');

  // Y axis labels
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    value: max * f,
    y: pad.top + innerH - f * innerH,
  }));

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 180 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yLabels.map((l) => (
          <g key={l.y}>
            <line x1={pad.left} y1={l.y} x2={width - pad.right} y2={l.y} stroke="#e2e8f0" strokeWidth={1} />
            <text x={pad.left - 6} y={l.y + 4} textAnchor="end" fontSize={10} fill="#94a3b8">
              ₾{l.value >= 1000 ? `${(l.value / 1000).toFixed(1)}k` : l.value.toFixed(0)}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={area} fill="url(#areaGrad)" />

        {/* Line */}
        <polyline points={polyline} fill="none" stroke="#6366f1" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* Dots + x labels */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} fill="#6366f1" />
            {(data.length <= 14 || i % 3 === 0) && (
              <text x={p.x} y={height - 6} textAnchor="middle" fontSize={9} fill="#94a3b8">
                {new Date(p.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </text>
            )}
          </g>
        ))}
      </svg>
    </Box>
  );
}

export function AccountantReports() {
  const t = useTranslations('accountant');
  const [range, setRange] = useState('30');

  const { data, isLoading } = useQuery<ReportData>({
    queryKey: ['accountant-reports', range],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/accountant/reports?range=${range}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ['Report', `Last ${range} days`],
      [],
      ['SUMMARY'],
      ['Total Orders', data.summary.total_orders],
      ['Total Revenue', `₾${data.summary.total_revenue.toFixed(2)}`],
      ['Total Subtotal', `₾${data.summary.total_subtotal.toFixed(2)}`],
      ['Total Discount', `₾${data.summary.total_discount.toFixed(2)}`],
      ['Total Delivery', `₾${data.summary.total_delivery.toFixed(2)}`],
      [],
      ['BY PAYMENT METHOD', 'Orders', 'Revenue'],
      ...data.by_payment_method.map((r) => [r.method, r.count, `₾${r.total.toFixed(2)}`]),
      [],
      ['BY PAYMENT STATUS', 'Orders', 'Revenue'],
      ...data.by_payment_status.map((r) => [r.status, r.count, `₾${r.total.toFixed(2)}`]),
      [],
      ['DAILY REVENUE', 'Date', 'Revenue', 'Orders'],
      ...data.daily_revenue.map((r) => [
        new Date(r.day).toLocaleDateString(),
        `₾${r.revenue.toFixed(2)}`,
        r.count,
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${range}days-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxPaymentTotal = Math.max(...(data?.by_payment_status.map((r) => r.total) ?? [1]));
  const maxOrderCount = Math.max(...(data?.by_order_status.map((r) => r.count) ?? [1]));

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{t('reportsTitle')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('reportsSubtitle')}</Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <ToggleButtonGroup
            value={range}
            exclusive
            onChange={(_, v) => v && setRange(v)}
            size="small"
          >
            <ToggleButton value="7">7d</ToggleButton>
            <ToggleButton value="30">30d</ToggleButton>
            <ToggleButton value="90">90d</ToggleButton>
            <ToggleButton value="365">1y</ToggleButton>
          </ToggleButtonGroup>
          <Button variant="outlined" startIcon={<Download />} onClick={handleExportCSV} disabled={!data} size="small">
            {t('exportCSV')}
          </Button>
        </Stack>
      </Stack>

      {/* Summary cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: t('totalOrders'), value: data?.summary.total_orders ?? 0, format: (v: number) => String(v), color: '#6366f1' },
          { label: t('totalRevenue'), value: data?.summary.total_revenue ?? 0, format: (v: number) => `₾${v.toFixed(2)}`, color: '#22c55e' },
          { label: t('totalDiscount'), value: data?.summary.total_discount ?? 0, format: (v: number) => `₾${v.toFixed(2)}`, color: '#f59e0b' },
          { label: t('totalDelivery'), value: data?.summary.total_delivery ?? 0, format: (v: number) => `₾${v.toFixed(2)}`, color: '#06b6d4' },
        ].map((card) => (
          <Grid size={{ xs: 6, md: 3 }} key={card.label}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '14px', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">{card.label}</Typography>
              {isLoading ? (
                <Skeleton width={80} height={36} />
              ) : (
                <Typography variant="h5" fontWeight={700} sx={{ color: card.color }}>
                  {card.format(card.value)}
                </Typography>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Revenue chart */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <TrendingUp color="primary" />
          <Typography variant="h6" fontWeight={600}>{t('dailyRevenue')}</Typography>
          <Chip label={t('paidOnly')} size="small" color="success" variant="outlined" />
        </Stack>
        {isLoading ? (
          <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
        ) : (
          <SimpleLineChart data={data?.daily_revenue ?? []} />
        )}
      </Paper>

      <Grid container spacing={3}>
        {/* Payment method breakdown */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <CreditCard fontSize="small" color="primary" />
              <Typography variant="h6" fontWeight={600}>{t('byPaymentMethod')}</Typography>
            </Stack>
            {isLoading ? (
              <Stack spacing={1}>{[1,2].map((i) => <Skeleton key={i} height={48} sx={{ borderRadius: 2 }} />)}</Stack>
            ) : (
              <Stack spacing={2}>
                {data?.by_payment_method.map((r) => (
                  <Box key={r.method}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {r.method === 'CARD' ? <CreditCard fontSize="small" /> : <Receipt fontSize="small" />}
                        <Typography variant="body2" fontWeight={500}>{r.method === 'CARD' ? t('card') : t('invoice')}</Typography>
                      </Stack>
                      <Stack alignItems="flex-end">
                        <Typography variant="body2" fontWeight={600}>₾{r.total.toFixed(2)}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.count} {t('ordersCount')}</Typography>
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Payment status breakdown */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>{t('byPaymentStatus')}</Typography>
            {isLoading ? (
              <Stack spacing={1}>{[1,2,3].map((i) => <Skeleton key={i} height={40} sx={{ borderRadius: 2 }} />)}</Stack>
            ) : (
              <Stack spacing={1.5}>
                {data?.by_payment_status.map((r) => (
                  <Box key={r.status}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Chip
                        label={t(`ps.${r.status}`)}
                        size="small"
                        sx={{ bgcolor: `${PAYMENT_STATUS_COLORS[r.status]}20`, color: PAYMENT_STATUS_COLORS[r.status], fontWeight: 600 }}
                      />
                      <Typography variant="body2" fontWeight={600}>₾{r.total.toFixed(2)}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <MiniBar value={r.total} max={maxPaymentTotal} color={PAYMENT_STATUS_COLORS[r.status] ?? '#94a3b8'} />
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{r.count}</Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Order status breakdown */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>{t('byOrderStatus')}</Typography>
            {isLoading ? (
              <Stack spacing={1}>{[1,2,3,4].map((i) => <Skeleton key={i} height={36} sx={{ borderRadius: 2 }} />)}</Stack>
            ) : (
              <Stack spacing={1.5}>
                {data?.by_order_status.map((r) => (
                  <Box key={r.status}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Chip
                        label={t(`os.${r.status}`)}
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: ORDER_STATUS_COLORS[r.status], color: ORDER_STATUS_COLORS[r.status] }}
                      />
                      <Typography variant="body2" fontWeight={600}>{r.count}</Typography>
                    </Stack>
                    <MiniBar value={r.count} max={maxOrderCount} color={ORDER_STATUS_COLORS[r.status] ?? '#94a3b8'} />
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Daily table */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Box sx={{ p: 3, pb: 1 }}>
              <Typography variant="h6" fontWeight={600}>{t('dailyBreakdown')}</Typography>
            </Box>
            <Divider />
            {isLoading ? (
              <Box sx={{ p: 3 }}><Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} /></Box>
            ) : !data?.daily_revenue.length ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">{t('noData')}</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600 }}>{t('date')}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>{t('ordersCount')}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{t('revenue')}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{t('avgOrder')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...data.daily_revenue].reverse().map((row) => (
                      <TableRow key={row.day} hover>
                        <TableCell>
                          {new Date(row.day).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </TableCell>
                        <TableCell align="center">{row.count}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>₾{row.revenue.toFixed(2)}</TableCell>
                        <TableCell align="right" color="text.secondary">
                          ₾{row.count > 0 ? (row.revenue / row.count).toFixed(2) : '0.00'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
