'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Tabs,
  Tab,
  Collapse,
  Avatar,
  Skeleton,
  Divider,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/providers';
import { vendorService } from '@/services';
import { Order, OrderStatus } from '@/types/models';

interface VendorOrdersProps {
  vendorId?: string;
}

const ORDER_STATUSES: (OrderStatus | 'all')[] = [
  'all',
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

const statusColors: Record<string, 'warning' | 'info' | 'primary' | 'secondary' | 'success' | 'error' | 'default'> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PROCESSING: 'primary',
  SHIPPED: 'secondary',
  DELIVERED: 'success',
  CANCELLED: 'error',
};

const paymentStatusColors: Record<string, 'warning' | 'info' | 'success' | 'error' | 'default'> = {
  PENDING: 'warning',
  INVOICE_SENT: 'info',
  PAID: 'success',
  FAILED: 'error',
  REFUNDED: 'default',
};

export function VendorOrders({ vendorId }: VendorOrdersProps) {
  const t = useTranslations('vendorDashboard');
  const locale = useLocale();
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['vendor', 'orders', filterStatus, vendorId],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const status = filterStatus !== 'all' ? filterStatus : undefined;
      return vendorService.getOrders(user, status, vendorId);
    },
    enabled: !!user,
  });

  const getProductName = (item: Order['items'] extends (infer T)[] ? T : never) => {
    const product = (item as any).product;
    if (!product) return '';
    return locale === 'ka' ? product.name_ka : product.name;
  };

  const calculateVendorTotal = (order: Order) => {
    if (!order.items) return 0;
    return order.items.reduce(
      (sum, item) => sum + parseFloat(item.price) * item.quantity,
      0
    );
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        {t('orders')}
      </Typography>

      {/* Status filter tabs */}
      <Paper sx={{ mb: 3, borderRadius: '12px' }}>
        <Tabs
          value={filterStatus}
          onChange={(_, value) => setFilterStatus(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              minWidth: 'auto',
            },
          }}
        >
          {ORDER_STATUSES.map((status) => (
            <Tab
              key={status}
              value={status}
              label={
                status === 'all'
                  ? t('allOrders')
                  : t(`orderStatuses.${status.toLowerCase()}`)
              }
            />
          ))}
        </Tabs>
      </Paper>

      {isLoading ? (
        <Stack spacing={2}>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: '12px' }} />
          ))}
        </Stack>
      ) : orders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
          <Typography color="text.secondary">{t('noOrders')}</Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {orders.map((order) => {
            const isExpanded = expandedOrder === order.id;
            const vendorTotal = calculateVendorTotal(order);

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
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  sx={{
                    p: 2.5,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ sm: 'center' }}
                    spacing={1}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box>
                        <Typography variant="body1" fontWeight={600}>
                          {t('orderNumber')}{order.order_number}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(order.created_at).toLocaleDateString(
                            locale === 'ka' ? 'ka-GE' : 'en-US',
                            { year: 'numeric', month: 'short', day: 'numeric' }
                          )}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Chip
                        label={t(`orderStatuses.${order.status.toLowerCase()}`)}
                        size="small"
                        color={statusColors[order.status] || 'default'}
                      />
                      <Chip
                        label={t(`paymentStatuses.${order.payment_status.toLowerCase()}`)}
                        size="small"
                        color={paymentStatusColors[order.payment_status] || 'default'}
                        variant="outlined"
                      />
                      <Typography variant="body1" fontWeight={700} color="primary.main">
                        ₾{vendorTotal.toFixed(2)}
                      </Typography>
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </Stack>
                  </Stack>
                </Box>

                {/* Expanded Details */}
                <Collapse in={isExpanded}>
                  <Divider />
                  <Box sx={{ p: 2.5 }}>
                    {/* Customer info */}
                    {(order as any).user && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {t('customer')}: {(order as any).user.first_name}{' '}
                        {(order as any).user.last_name} ({(order as any).user.email})
                      </Typography>
                    )}

                    {/* Order Items */}
                    <Stack spacing={1.5}>
                      {order.items?.map((item) => {
                        const product = (item as any).product;
                        const imageUrl = product?.media?.[0]?.url;
                        const itemTotal = parseFloat(item.price) * item.quantity;

                        return (
                          <Stack
                            key={item.id}
                            direction="row"
                            alignItems="center"
                            spacing={2}
                            sx={{
                              p: 1.5,
                              borderRadius: '8px',
                              bgcolor: '#f8f9fa',
                            }}
                          >
                            <Avatar
                              src={imageUrl}
                              variant="rounded"
                              sx={{ width: 40, height: 40, bgcolor: '#e0e0e0' }}
                            />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight={600}>
                                {getProductName(item)}
                              </Typography>
                              {item.variant_name && (
                                <Typography variant="caption" color="text.secondary">
                                  {item.variant_name}
                                </Typography>
                              )}
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {item.quantity} × ₾{parseFloat(item.price).toFixed(2)}
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              ₾{itemTotal.toFixed(2)}
                            </Typography>
                          </Stack>
                        );
                      })}
                    </Stack>

                    {/* Vendor Total */}
                    <Box
                      sx={{
                        mt: 2,
                        pt: 2,
                        borderTop: '1px solid #e0e0e0',
                        display: 'flex',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <Typography variant="body1" fontWeight={700}>
                        {t('vendorTotal')}: ₾{vendorTotal.toFixed(2)}
                      </Typography>
                    </Box>
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
