'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Stack,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Collapse,
  Divider,
  Avatar,
  Alert,
  TextField,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/providers';
import { Order, OrderStatus, PaymentStatus } from '@/types/models';

const ORDER_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const PAYMENT_STATUSES: PaymentStatus[] = ['PENDING', 'INVOICE_SENT', 'PAID', 'FAILED', 'REFUNDED'];

export function OrdersManagement() {
  const t = useTranslations('admin');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filterOptions = ['all', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  useEffect(() => {
    fetchOrders();
  }, [user, filterTab]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const status = filterOptions[filterTab];
      const params = status !== 'all' ? `?status=${status}` : '';

      const response = await fetch(`/api/admin/orders${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, field: 'status' | 'payment_status', value: string) => {
    if (!user) return;
    setUpdating(orderId);
    setError(null);
    setSuccess(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        const updated = await response.json();
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
        setSuccess(t('orderStatusUpdated'));
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update');
      }
    } catch (err) {
      setError('Failed to update order');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'CONFIRMED': return 'info';
      case 'PROCESSING': return 'primary';
      case 'SHIPPED': return 'secondary';
      case 'DELIVERED': return 'success';
      case 'CANCELLED': return 'error';
      case 'INVOICE_SENT': return 'info';
      case 'PAID': return 'success';
      case 'FAILED': return 'error';
      case 'REFUNDED': return 'secondary';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ka-GE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${num.toFixed(2)} ₾`;
  };

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        {t('ordersManagement')}
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

      {/* Filter Tabs */}
      <Paper sx={{ mb: 3, borderRadius: '12px' }}>
        <Tabs
          value={filterTab}
          onChange={(_, v) => setFilterTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 500 },
          }}
        >
          <Tab label={t('allOrders')} />
          <Tab label={t('orderStatuses.pending')} />
          <Tab label={t('orderStatuses.confirmed')} />
          <Tab label={t('orderStatuses.processing')} />
          <Tab label={t('orderStatuses.shipped')} />
          <Tab label={t('orderStatuses.delivered')} />
          <Tab label={t('orderStatuses.cancelled')} />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : orders.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: '16px', textAlign: 'center' }}>
          <Typography color="text.secondary">{t('noOrders')}</Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {orders.map((order) => {
            const orderUser = order.user;

            return (
              <Paper
                key={order.id}
                sx={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                {/* Order Header */}
                <Box
                  sx={{
                    p: 2.5,
                    backgroundColor: '#f5f6fa',
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleOrderDetails(order.id)}
                >
                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', md: 'center' }}
                    spacing={2}
                  >
                    <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
                      <Typography variant="h6" fontWeight={700} color="primary.main">
                        {order.order_number}
                      </Typography>
                      <Chip
                        label={t(`orderStatuses.${order.status.toLowerCase()}`)}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                      <Chip
                        label={t(`paymentStatuses.${order.payment_status.toLowerCase()}`)}
                        color={getStatusColor(order.payment_status)}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={3}>
                      {orderUser && (
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" fontWeight={600}>
                            {orderUser.first_name} {orderUser.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {orderUser.email}
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(order.created_at)}
                        </Typography>
                        <Typography variant="h6" fontWeight={700}>
                          {formatCurrency(order.total)}
                        </Typography>
                      </Box>
                      {expandedOrderId === order.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </Stack>
                  </Stack>
                </Box>

                {/* Order Details */}
                <Collapse in={expandedOrderId === order.id}>
                  <Divider />
                  <Box sx={{ p: 3 }}>
                    {/* Status Controls */}
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                      {t('updateStatus')}
                    </Typography>

                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={3}
                      sx={{ mb: 3 }}
                    >
                      <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel>{t('orderStatus')}</InputLabel>
                        <Select
                          value={order.status}
                          label={t('orderStatus')}
                          disabled={updating === order.id}
                          onChange={(e) => handleUpdateStatus(order.id, 'status', e.target.value)}
                          sx={{ borderRadius: '10px' }}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <MenuItem key={s} value={s}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Chip
                                  label={t(`orderStatuses.${s.toLowerCase()}`)}
                                  color={getStatusColor(s)}
                                  size="small"
                                />
                              </Stack>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel>{t('paymentStatusField')}</InputLabel>
                        <Select
                          value={order.payment_status}
                          label={t('paymentStatusField')}
                          disabled={updating === order.id}
                          onChange={(e) => handleUpdateStatus(order.id, 'payment_status', e.target.value)}
                          sx={{ borderRadius: '10px' }}
                        >
                          {PAYMENT_STATUSES.map((s) => (
                            <MenuItem key={s} value={s}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Chip
                                  label={t(`paymentStatuses.${s.toLowerCase()}`)}
                                  color={getStatusColor(s)}
                                  size="small"
                                />
                              </Stack>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {updating === order.id && <CircularProgress size={24} />}
                    </Stack>

                    {/* Order Info */}
                    <Divider sx={{ my: 2 }} />

                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={3}
                      sx={{ mb: 3 }}
                    >
                      {order.address && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {t('deliveryAddress')}
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {order.address.city}, {order.address.address}
                          </Typography>
                        </Box>
                      )}
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {t('paymentMethodField')}
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {order.payment_method === 'INVOICE' ? t('invoiceMethod') : order.payment_method}
                        </Typography>
                      </Box>
                      {order.invoice_url && (
                        <Box>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DownloadIcon />}
                            href={order.invoice_url}
                            target="_blank"
                            sx={{ borderRadius: '10px' }}
                          >
                            {t('viewInvoice')}
                          </Button>
                        </Box>
                      )}
                    </Stack>

                    {/* Order Items */}
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                      {t('orderItemsTitle')} ({order.items?.length || 0})
                    </Typography>

                    <Stack spacing={1.5} sx={{ mb: 3 }}>
                      {order.items?.map((item) => (
                        <Box
                          key={item.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            p: 1.5,
                            backgroundColor: '#f5f6fa',
                            borderRadius: '10px',
                          }}
                        >
                          <Avatar
                            variant="rounded"
                            src={item.product?.media?.[0]?.url}
                            sx={{ width: 48, height: 48 }}
                          >
                            {item.product?.name?.charAt(0)}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={500}>
                              {item.product?.name}
                            </Typography>
                            {item.variant_name && (
                              <Typography variant="caption" color="primary.main" fontWeight={500}>
                                {item.variant_name}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary" display="block">
                              {item.quantity} x {formatCurrency(item.price)}
                            </Typography>
                          </Box>
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(parseFloat(item.price) * item.quantity)}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>

                    {/* Totals */}
                    <Stack spacing={0.5} sx={{ maxWidth: 250, ml: 'auto' }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">{t('subtotalLabel')}</Typography>
                        <Typography variant="body2">{formatCurrency(order.subtotal)}</Typography>
                      </Stack>
                      {parseFloat(order.discount) > 0 && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">{t('discountLabel')}</Typography>
                          <Typography variant="body2" color="error.main">-{formatCurrency(order.discount)}</Typography>
                        </Stack>
                      )}
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">{t('deliveryLabel')}</Typography>
                        <Typography variant="body2">
                          {parseFloat(order.delivery_fee) === 0 ? t('freeDelivery') : formatCurrency(order.delivery_fee)}
                        </Typography>
                      </Stack>
                      <Divider />
                      <Stack direction="row" justifyContent="space-between">
                        <Typography fontWeight={700}>{t('totalLabel')}</Typography>
                        <Typography fontWeight={700} color="primary.main">{formatCurrency(order.total)}</Typography>
                      </Stack>
                    </Stack>

                    {order.notes && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">{t('orderNotes')}</Typography>
                        <Typography variant="body1">{order.notes}</Typography>
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
