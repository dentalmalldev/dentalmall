'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Stack, Chip, CircularProgress, Alert, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TablePagination, Paper,
  FormControl, InputLabel, Select, MenuItem, Collapse, IconButton, Divider,
} from '@mui/material';
import { ExpandMore, ExpandLess, OpenInNew } from '@mui/icons-material';
import { useAuth } from '@/providers';
import { useTranslations } from 'next-intl';

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'primary' | 'success' | 'error'> = {
  PENDING: 'warning', CONFIRMED: 'info', PROCESSING: 'primary',
  SHIPPED: 'primary', DELIVERED: 'success', CANCELLED: 'error',
};
const PAYMENT_COLORS: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error' | 'secondary'> = {
  PENDING: 'warning', INVOICE_SENT: 'info', PAID: 'success',
  FAILED: 'error', REFUNDED: 'secondary',
};

interface OrderItem {
  id: string;
  product: { name: string; name_ka: string };
  variant_option: { name: string } | null;
  variant_name: string | null;
  quantity: number;
  price: string;
}

interface Order {
  id: string;
  order_number: string;
  total: string;
  status: string;
  payment_status: string;
  payment_method: string;
  invoice_url: string | null;
  created_at: string;
  items: OrderItem[];
  _count: { items: number };
}

export function UserTabOrders({ userId }: { userId: string }) {
  const { user } = useAuth();
  const t = useTranslations('admin');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams({ page: String(page + 1), limit: '20', ...(statusFilter ? { status: statusFilter } : {}) });
      const res = await globalThis.fetch(`/api/admin/users/${userId}/orders?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setOrders(data.data);
      setTotal(data.total);
    } catch { setError(t('actionFailed')); }
    finally { setLoading(false); }
  }, [user, userId, page, statusFilter, t]);

  useEffect(() => { fetch(); }, [fetch]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ka-GE', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <Box>
      <Stack direction="row" spacing={2} mb={2} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{t('orderStatus')}</InputLabel>
          <Select value={statusFilter} label={t('orderStatus')} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
            <MenuItem value="">{t('allOrders')}</MenuItem>
            {['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED'].map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary">{t('totalOrders')}: {total}</Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: '10px', overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f6fa' }}>
                  <TableCell sx={{ fontWeight: 600 }}>{t('orderNumber') || 'Order #'}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('registrationDate')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('totalLabel')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('orderStatus')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('paymentStatusField')}</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>{t('noOrders')}</TableCell></TableRow>
                ) : orders.map((o) => (
                  <>
                    <TableRow key={o.id} hover sx={{ cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}>
                      <TableCell><Typography variant="body2" fontWeight={600}>{o.order_number}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{formatDate(o.created_at)}</Typography></TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>₾{parseFloat(o.total).toFixed(2)}</Typography></TableCell>
                      <TableCell><Chip label={o.status} color={STATUS_COLORS[o.status] || 'default'} size="small" /></TableCell>
                      <TableCell><Chip label={o.payment_status} color={PAYMENT_COLORS[o.payment_status] || 'default'} size="small" /></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          {o.invoice_url && (
                            <IconButton size="small" href={o.invoice_url} target="_blank" onClick={(e) => e.stopPropagation()}>
                              <OpenInNew fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton size="small">{expandedId === o.id ? <ExpandLess /> : <ExpandMore />}</IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                    <TableRow key={`${o.id}-detail`}>
                      <TableCell colSpan={6} sx={{ p: 0 }}>
                        <Collapse in={expandedId === o.id}>
                          <Box sx={{ p: 2, bgcolor: '#fafafa' }}>
                            <Divider sx={{ mb: 1.5 }} />
                            {o.items.map((item) => (
                              <Stack key={item.id} direction="row" justifyContent="space-between" py={0.5}>
                                <Typography variant="body2">{item.product.name}{(item.variant_name || item.variant_option?.name) ? ` — ${item.variant_name || item.variant_option?.name}` : ''} × {item.quantity}</Typography>
                                <Typography variant="body2" fontWeight={500}>₾{(parseFloat(item.price) * item.quantity).toFixed(2)}</Typography>
                              </Stack>
                            ))}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={total} page={page} rowsPerPage={20} rowsPerPageOptions={[20]} onPageChange={(_e, p) => setPage(p)} />
        </Paper>
      )}
    </Box>
  );
}
