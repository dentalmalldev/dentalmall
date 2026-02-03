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
  Collapse,
  Divider,
  Avatar,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Download as DownloadIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/providers';
import { ordersService } from '@/services';
import { Order } from '@/types/models';

export function MyOrders() {
  const t = useTranslations('orders');
  const locale = useLocale();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await ordersService.getOrders(user);
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
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
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'INVOICE_SENT': return 'info';
      case 'PAID': return 'success';
      case 'FAILED': return 'error';
      case 'REFUNDED': return 'secondary';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} sx={{ mb: 3 }}>
        {t('title')}
      </Typography>

      {orders.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            borderRadius: '16px',
            textAlign: 'center',
            backgroundColor: '#f5f6fa',
          }}
        >
          <ShippingIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {t('noOrders')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('noOrdersDescription')}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {orders.map((order) => (
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
                  p: 3,
                  backgroundColor: '#f5f6fa',
                  cursor: 'pointer',
                }}
                onClick={() => toggleOrderDetails(order.id)}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  spacing={2}
                >
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Typography variant="h6" fontWeight={700} color="primary.main">
                        {order.order_number}
                      </Typography>
                      <Chip
                        label={t(`status.${order.status.toLowerCase()}`)}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {formatDate(order.created_at)}
                    </Typography>
                  </Box>

                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('total')}
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {formatCurrency(order.total)}
                      </Typography>
                    </Box>
                    {expandedOrderId === order.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </Stack>
                </Stack>
              </Box>

              {/* Order Details (Expandable) */}
              <Collapse in={expandedOrderId === order.id}>
                <Divider />
                <Box sx={{ p: 3 }}>
                  {/* Payment Info */}
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={3}
                    sx={{ mb: 3 }}
                  >
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('paymentStatusLabel')}
                      </Typography>
                      <Chip
                        label={t(`paymentStatus.${order.payment_status.toLowerCase()}`)}
                        color={getPaymentStatusColor(order.payment_status)}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('paymentMethod')}
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {order.payment_method === 'INVOICE' ? t('invoice') : order.payment_method}
                      </Typography>
                    </Box>
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
                  </Stack>

                  {/* Invoice Download */}
                  {order.invoice_url && (
                    <Box sx={{ mb: 3 }}>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        href={order.invoice_url}
                        target="_blank"
                        sx={{ borderRadius: '12px' }}
                      >
                        {t('downloadInvoice')}
                      </Button>
                    </Box>
                  )}

                  {/* Order Items */}
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                    {t('orderItems')} ({order.items?.length || 0})
                  </Typography>

                  <Stack spacing={2}>
                    {order.items?.map((item) => (
                      <Box
                        key={item.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 2,
                          backgroundColor: '#f5f6fa',
                          borderRadius: '12px',
                        }}
                      >
                        <Avatar
                          variant="rounded"
                          src={item.product?.media?.[0]?.url}
                          sx={{ width: 60, height: 60 }}
                        >
                          {item.product?.name?.charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" fontWeight={500}>
                            {locale === 'ka' ? item.product?.name_ka : item.product?.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t('quantity')}: {item.quantity}
                          </Typography>
                        </Box>
                        <Typography variant="body1" fontWeight={600}>
                          {formatCurrency(parseFloat(item.price) * item.quantity)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>

                  {/* Order Summary */}
                  <Divider sx={{ my: 3 }} />
                  <Stack spacing={1} sx={{ maxWidth: 300, ml: 'auto' }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">{t('subtotal')}</Typography>
                      <Typography>{formatCurrency(order.subtotal)}</Typography>
                    </Stack>
                    {parseFloat(order.discount) > 0 && (
                      <Stack direction="row" justifyContent="space-between">
                        <Typography color="text.secondary">{t('discount')}</Typography>
                        <Typography color="error.main">-{formatCurrency(order.discount)}</Typography>
                      </Stack>
                    )}
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">{t('delivery')}</Typography>
                      <Typography>
                        {parseFloat(order.delivery_fee) === 0 ? t('free') : formatCurrency(order.delivery_fee)}
                      </Typography>
                    </Stack>
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography fontWeight={700}>{t('total')}</Typography>
                      <Typography fontWeight={700} color="primary.main">
                        {formatCurrency(order.total)}
                      </Typography>
                    </Stack>
                  </Stack>

                  {/* Notes */}
                  {order.notes && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('notes')}
                      </Typography>
                      <Typography variant="body1">{order.notes}</Typography>
                    </Box>
                  )}
                </Box>
              </Collapse>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
