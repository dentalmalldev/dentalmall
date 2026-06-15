'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Stack,
  Chip,
  Button,
  Divider,
  Avatar,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  CheckCircle as ConfirmIcon,
  Cancel as CancelIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/providers';
import { Order, OrderStatus } from '@/types/models';

const TAB_STATUSES: OrderStatus[] = [
  'AWAITING_ADMIN_CONFIRMATION',
  'CONFIRMED_PENDING_PAYMENT',
  'CANCELLED_UNAVAILABLE',
];

interface Counts {
  pending: number;
  confirmed: number;
  cancelled: number;
}

export function SpecialOrdersManagement() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState<Counts>({ pending: 0, confirmed: 0, cancelled: 0 });
  const [acting, setActing] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cancel dialog
  const [cancelOrder, setCancelOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const status = TAB_STATUSES[tab];
      const res = await fetch(`/api/admin/special-orders?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setOrders(json.data);
        setCounts(json.counts);
      }
    } catch (err) {
      console.error('Error fetching special orders:', err);
    } finally {
      setLoading(false);
    }
  }, [user, tab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const runAction = async (orderId: string, action: 'confirm-availability' | 'cancel-unavailable', reason?: string) => {
    if (!user) return;
    setActing(orderId);
    setError(null);
    setSuccess(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/orders/${orderId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reason !== undefined ? { reason } : {}),
      });
      if (res.ok) {
        setSuccess(action === 'confirm-availability' ? t('specialOrderConfirmed') : t('specialOrderCancelled'));
        await fetchOrders();
      } else {
        const data = await res.json();
        setError(data.error || 'Action failed');
      }
    } catch {
      setError('Action failed');
    } finally {
      setActing(null);
    }
  };

  const handleConfirm = (order: Order) => runAction(order.id, 'confirm-availability');

  const handleCancelSubmit = async () => {
    if (!cancelOrder) return;
    const order = cancelOrder;
    setCancelOrder(null);
    await runAction(order.id, 'cancel-unavailable', cancelReason.trim());
    setCancelReason('');
  };

  const getStatusColor = (status: string): 'warning' | 'info' | 'error' | 'default' => {
    switch (status) {
      case 'AWAITING_ADMIN_CONFIRMATION': return 'warning';
      case 'CONFIRMED_PENDING_PAYMENT': return 'info';
      case 'CANCELLED_UNAVAILABLE': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ka-GE', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    });

  const formatCurrency = (amount: string | number) =>
    `${(typeof amount === 'string' ? parseFloat(amount) : amount).toFixed(2)} ₾`;

  const getVendorNames = (order: Order): string[] => {
    const names = new Set<string>();
    (order.items || []).forEach((item) => {
      if (item.product?.vendor?.company_name) names.add(item.product.vendor.company_name);
    });
    return Array.from(names);
  };

  const tabBadge = (n: number) => (n > 0 ? ` (${n})` : '');

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        {t('specialOrders')}
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3, borderRadius: '12px' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 500 } }}
        >
          <Tab label={`${t('specialOrdersPending')}${tabBadge(counts.pending)}`} />
          <Tab label={`${t('specialOrdersConfirmed')}${tabBadge(counts.confirmed)}`} />
          <Tab label={`${t('specialOrdersCancelled')}${tabBadge(counts.cancelled)}`} />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : orders.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: '16px', textAlign: 'center' }}>
          <Typography color="text.secondary">{t('noSpecialOrders')}</Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {orders.map((order) => {
            const vendors = getVendorNames(order);
            const isPending = order.status === 'AWAITING_ADMIN_CONFIRMATION';
            return (
              <Paper key={order.id} sx={{ borderRadius: '16px', p: { xs: 2, md: 2.5 }, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                  spacing={2}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
                      <Typography variant="h6" fontWeight={700} color="primary.main">
                        {order.order_number}
                      </Typography>
                      <Chip
                        label={t(`orderStatuses.${order.status.toLowerCase()}`)}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                      {order.order_group_id && (
                        <Chip label={t('partOfGroup')} size="small" variant="outlined" color="secondary" />
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {order.user?.first_name} {order.user?.last_name} · {order.user?.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(order.created_at)} · {t('orderItemsTitle')}: {order.items?.length || 0}
                    </Typography>
                    {vendors.length > 0 && (
                      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                        <StoreIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        {vendors.map((v) => (
                          <Chip key={v} label={v} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    )}
                  </Box>

                  <Stack direction={{ xs: 'row', md: 'column' }} alignItems={{ xs: 'center', md: 'flex-end' }} spacing={1}>
                    <Typography variant="h6" fontWeight={700}>
                      {formatCurrency(order.total)}
                    </Typography>
                  </Stack>
                </Stack>

                {/* Items preview */}
                <Divider sx={{ my: 1.5 }} />
                <Stack spacing={1}>
                  {(order.items || []).map((item) => (
                    <Stack key={item.id} direction="row" alignItems="center" spacing={1.5}>
                      <Avatar variant="rounded" src={item.product?.media?.[0]?.url} sx={{ width: 36, height: 36 }}>
                        {item.product?.name?.charAt(0)}
                      </Avatar>
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {locale === 'ka' ? item.product?.name_ka : item.product?.name}
                        {item.variant_name ? ` · ${item.variant_name}` : ''}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ×{item.quantity}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>

                {isPending && (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CancelIcon />}
                      disabled={acting === order.id}
                      onClick={() => { setCancelOrder(order); setCancelReason(''); }}
                    >
                      {t('specialOrderCancelAction')}
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={acting === order.id ? <CircularProgress size={18} color="inherit" /> : <ConfirmIcon />}
                      disabled={acting === order.id}
                      onClick={() => handleConfirm(order)}
                    >
                      {t('specialOrderConfirmAction')}
                    </Button>
                  </Stack>
                )}

                {order.status === 'CANCELLED_UNAVAILABLE' && order.cancellation_reason && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    {t('cancellationReason')}: {order.cancellation_reason}
                  </Alert>
                )}
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* Cancel reason dialog */}
      <Dialog open={!!cancelOrder} onClose={() => setCancelOrder(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('specialOrderCancelAction')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('specialOrderCancelConfirm')}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            label={t('cancellationReason')}
            placeholder={t('cancellationReasonPlaceholder')}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOrder(null)}>{t('cancel')}</Button>
          <Button variant="contained" color="error" onClick={handleCancelSubmit}>
            {t('specialOrderCancelAction')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
