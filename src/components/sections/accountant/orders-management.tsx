'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Stack,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Tooltip,
  Collapse,
  Grid,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Badge,
} from '@mui/material';
import {
  Visibility,
  CheckCircle,
  Download,
  FilterList,
  ClearAll,
  ExpandMore,
  ExpandLess,
  CreditCard,
  Receipt,
  Lock,
} from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { Order, OrderStatus, PaymentStatus, PaginatedResponse } from '@/types/models';
import { PaymentVerificationModal } from './payment-verification-modal';

const ORDER_STATUS_COLORS: Record<OrderStatus, 'default' | 'warning' | 'info' | 'primary' | 'success' | 'error'> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PROCESSING: 'primary',
  SHIPPED: 'primary',
  DELIVERED: 'success',
  CANCELLED: 'error',
};

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  PENDING: 'default',
  INVOICE_SENT: 'warning',
  PAID: 'success',
  FAILED: 'error',
  REFUNDED: 'info',
};

interface Filters {
  search: string;
  payment_status: string;
  payment_method: string;
  status: string;
  date_from: string;
  date_to: string;
}

const DEFAULT_FILTERS: Filters = {
  search: '',
  payment_status: '',
  payment_method: '',
  status: '',
  date_from: '',
  date_to: '',
};

// Order detail dialog
function OrderDetailDialog({ order, open, onClose, onVerify }: {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onVerify: (order: Order) => void;
}) {
  const t = useTranslations('accountant');
  if (!order) return null;

  const canVerify = order.payment_method === 'INVOICE' && order.payment_status === 'INVOICE_SENT';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            {t('orderDetails')} — {order.order_number}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip
              label={t(`os.${order.status}`)}
              color={ORDER_STATUS_COLORS[order.status]}
              size="small"
            />
            <Chip
              label={t(`ps.${order.payment_status}`)}
              color={PAYMENT_STATUS_COLORS[order.payment_status]}
              size="small"
            />
          </Stack>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          {/* Customer info */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>{t('customerInfo')}</Typography>
            <Stack spacing={0.5}>
              <Typography variant="body2">{order.user?.first_name} {order.user?.last_name}</Typography>
              <Typography variant="body2" color="text.secondary">{order.user?.email}</Typography>
            </Stack>
          </Grid>

          {/* Address */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>{t('deliveryAddress')}</Typography>
            {order.address && (
              <Stack spacing={0.5}>
                <Typography variant="body2">{order.address.recipient_name}</Typography>
                <Typography variant="body2" color="text.secondary">{order.address.mobile_number}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.address.city}, {order.address.address}
                  {order.address.postal_code ? `, ${order.address.postal_code}` : ''}
                </Typography>
              </Stack>
            )}
          </Grid>

          {/* Payment info */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>{t('paymentInfo')}</Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Chip
                icon={order.payment_method === 'CARD' ? <CreditCard fontSize="small" /> : <Receipt fontSize="small" />}
                label={order.payment_method === 'CARD' ? t('card') : t('invoice')}
                variant="outlined"
                size="small"
              />
              {order.payment_method === 'CARD' && (
                <Chip
                  icon={<Lock fontSize="small" />}
                  label={t('autoProcessed')}
                  size="small"
                  color="default"
                />
              )}
              {order.payment_verified_at && (
                <Chip
                  label={`${t('verifiedAt')}: ${new Date(order.payment_verified_at).toLocaleString()}`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
            </Stack>
            {order.payment_notes && (
              <Box sx={{ mt: 1, p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">{t('paymentNotes')}:</Typography>
                <Typography variant="body2">{order.payment_notes}</Typography>
              </Box>
            )}
            {order.notes && (
              <Box sx={{ mt: 1, p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">{t('orderNotes')}:</Typography>
                <Typography variant="body2">{order.notes}</Typography>
              </Box>
            )}
          </Grid>

          {/* Items */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>{t('orderItems')}</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell>{t('product')}</TableCell>
                    <TableCell align="center">{t('quantity')}</TableCell>
                    <TableCell align="right">{t('price')}</TableCell>
                    <TableCell align="right">{t('itemTotal')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Typography variant="body2">{item.product?.name}</Typography>
                        {item.variant_name && (
                          <Typography variant="caption" color="text.secondary">{item.variant_name}</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="right">₾{parseFloat(item.price).toFixed(2)}</TableCell>
                      <TableCell align="right">₾{(item.quantity * parseFloat(item.price)).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Totals */}
          <Grid size={{ xs: 12 }}>
            <Box sx={{ maxWidth: 320, ml: 'auto' }}>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">{t('subtotal')}</Typography>
                  <Typography variant="body2">₾{parseFloat(order.subtotal).toFixed(2)}</Typography>
                </Stack>
                {parseFloat(order.discount) > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">{t('discount')}</Typography>
                    <Typography variant="body2" color="error.main">-₾{parseFloat(order.discount).toFixed(2)}</Typography>
                  </Stack>
                )}
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">{t('deliveryFee')}</Typography>
                  <Typography variant="body2">₾{parseFloat(order.delivery_fee).toFixed(2)}</Typography>
                </Stack>
                <Divider />
                <Stack direction="row" justifyContent="space-between">
                  <Typography fontWeight={700}>{t('total')}</Typography>
                  <Typography fontWeight={700} color="primary.main">₾{parseFloat(order.total).toFixed(2)}</Typography>
                </Stack>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">{t('close')}</Button>
        {canVerify && (
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            onClick={() => { onClose(); onVerify(order); }}
          >
            {t('confirmPayment')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export function OrdersManagement() {
  const t = useTranslations('accountant');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab');

  const filtersForTab = (tab: string | null): Filters => {
    const base = { ...DEFAULT_FILTERS };
    if (tab === 'pending') base.payment_status = 'INVOICE_SENT';
    else if (tab === 'card') base.payment_method = 'CARD';
    else if (tab === 'paid_today') base.payment_status = 'PAID';
    return base;
  };

  const [filters, setFilters] = useState<Filters>(() => filtersForTab(tabParam));
  const [activeTab, setActiveTab] = useState<string>(tabParam || 'all');

  // Sync state when URL tab param changes (e.g. sidebar navigation)
  useEffect(() => {
    const tab = tabParam || 'all';
    setActiveTab(tab);
    setFilters(filtersForTab(tabParam));
    setPage(0);
  }, [tabParam]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [showFilters, setShowFilters] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [verifyOrder, setVerifyOrder] = useState<Order | null>(null);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', String(page + 1));
    params.set('limit', String(rowsPerPage));
    if (filters.search) params.set('search', filters.search);
    if (filters.payment_status) params.set('payment_status', filters.payment_status);
    if (filters.payment_method) params.set('payment_method', filters.payment_method);
    if (filters.status) params.set('status', filters.status);
    if (filters.date_from) params.set('date_from', filters.date_from);
    if (filters.date_to) params.set('date_to', filters.date_to);
    return params.toString();
  }, [filters, page, rowsPerPage]);

  const { data, isLoading, isError } = useQuery<PaginatedResponse<Order>>({
    queryKey: ['accountant-orders', filters, page, rowsPerPage],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/accountant/orders?${buildQuery()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(0);
    const base = { ...DEFAULT_FILTERS };
    if (tab === 'pending') base.payment_status = 'INVOICE_SENT';
    else if (tab === 'card') base.payment_method = 'CARD';
    else if (tab === 'paid_today') base.payment_status = 'PAID';
    setFilters(base);
    router.push(`/${locale}/accountant/orders?tab=${tab}`, { scroll: false });
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setActiveTab('all');
    setPage(0);
  };

  const handleExportCSV = () => {
    if (!data?.data) return;
    const headers = ['Order #', 'Date', 'Customer', 'Email', 'Items', 'Total', 'Payment Method', 'Payment Status', 'Order Status'];
    const rows = data.data.map((o) => [
      o.order_number,
      new Date(o.created_at).toLocaleDateString(),
      `${o.user?.first_name} ${o.user?.last_name}`,
      o.user?.email,
      o.items?.length ?? 0,
      parseFloat(o.total).toFixed(2),
      o.payment_method,
      o.payment_status,
      o.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const TABS = [
    { key: 'all', label: t('tabAll') },
    { key: 'pending', label: t('tabPending') },
    { key: 'paid_today', label: t('tabPaidToday') },
    { key: 'card', label: t('tabCard') },
  ];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{t('ordersTitle')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('ordersSubtitle')}</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportCSV}
            disabled={!data?.data?.length}
            size="small"
          >
            {t('exportCSV')}
          </Button>
          <Badge badgeContent={activeFilterCount} color="primary">
            <Button
              variant={showFilters ? 'contained' : 'outlined'}
              startIcon={<FilterList />}
              onClick={() => setShowFilters((v) => !v)}
              endIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
              size="small"
            >
              {t('filters')}
            </Button>
          </Badge>
        </Stack>
      </Stack>

      {/* Tabs */}
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
        {TABS.map((tab) => (
          <Chip
            key={tab.key}
            label={tab.label}
            onClick={() => handleTabChange(tab.key)}
            color={activeTab === tab.key ? 'primary' : 'default'}
            variant={activeTab === tab.key ? 'filled' : 'outlined'}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Stack>

      {/* Filters panel */}
      <Collapse in={showFilters}>
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px', mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label={t('search')}
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                fullWidth size="small" placeholder={t('searchPlaceholder')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('paymentStatusLabel')}</InputLabel>
                <Select
                  value={filters.payment_status}
                  label={t('paymentStatusLabel')}
                  onChange={(e) => setFilters((f) => ({ ...f, payment_status: e.target.value }))}
                >
                  <MenuItem value="">{t('all')}</MenuItem>
                  <MenuItem value="PENDING">{t('ps.PENDING')}</MenuItem>
                  <MenuItem value="INVOICE_SENT">{t('ps.INVOICE_SENT')}</MenuItem>
                  <MenuItem value="PAID">{t('ps.PAID')}</MenuItem>
                  <MenuItem value="FAILED">{t('ps.FAILED')}</MenuItem>
                  <MenuItem value="REFUNDED">{t('ps.REFUNDED')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('paymentMethod')}</InputLabel>
                <Select
                  value={filters.payment_method}
                  label={t('paymentMethod')}
                  onChange={(e) => setFilters((f) => ({ ...f, payment_method: e.target.value }))}
                >
                  <MenuItem value="">{t('all')}</MenuItem>
                  <MenuItem value="INVOICE">{t('invoice')}</MenuItem>
                  <MenuItem value="CARD">{t('card')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('orderStatusLabel')}</InputLabel>
                <Select
                  value={filters.status}
                  label={t('orderStatusLabel')}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                >
                  <MenuItem value="">{t('all')}</MenuItem>
                  {(['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED'] as OrderStatus[]).map((s) => (
                    <MenuItem key={s} value={s}>{t(`os.${s}`)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 1.5 }}>
              <TextField
                label={t('dateFrom')} type="date" value={filters.date_from}
                onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
                fullWidth size="small" InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 1.5 }}>
              <TextField
                label={t('dateTo')} type="date" value={filters.date_to}
                onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
                fullWidth size="small" InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 'auto' }}>
              <Button startIcon={<ClearAll />} onClick={handleClearFilters} size="small">
                {t('clearFilters')}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : isError ? (
          <Alert severity="error" sx={{ m: 2 }}>{t('loadError')}</Alert>
        ) : !data?.data?.length ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">{t('noOrders')}</Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>{t('orderNumber')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('date')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('customer')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('total')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('paymentMethod')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('paymentStatusLabel')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('orderStatusLabel')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{t('actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.data.map((order) => {
                    const canVerify = order.payment_method === 'INVOICE' && order.payment_status === 'INVOICE_SENT';
                    return (
                      <TableRow key={order.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} fontFamily="monospace">
                            {order.order_number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(order.created_at).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {order.user?.first_name} {order.user?.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {order.user?.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            ₾{parseFloat(order.total).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={order.payment_method === 'CARD' ? <CreditCard sx={{ fontSize: '14px !important' }} /> : <Receipt sx={{ fontSize: '14px !important' }} />}
                            label={order.payment_method === 'CARD' ? t('card') : t('invoice')}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={t(`ps.${order.payment_status}`)}
                            color={PAYMENT_STATUS_COLORS[order.payment_status]}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={t(`os.${order.status}`)}
                            color={ORDER_STATUS_COLORS[order.status]}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title={t('viewDetails')}>
                              <IconButton size="small" onClick={() => setDetailOrder(order)}>
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {canVerify ? (
                              <Tooltip title={t('confirmPayment')}>
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => setVerifyOrder(order)}
                                >
                                  <CheckCircle fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : order.payment_method === 'CARD' ? (
                              <Tooltip title={t('autoProcessedTooltip')}>
                                <span>
                                  <IconButton size="small" disabled>
                                    <Lock fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            ) : null}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={data.total}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
              rowsPerPageOptions={[10, 20, 50]}
              labelRowsPerPage={t('rowsPerPage')}
            />
          </>
        )}
      </Paper>

      <OrderDetailDialog
        order={detailOrder}
        open={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        onVerify={(order) => setVerifyOrder(order)}
      />

      <PaymentVerificationModal
        order={verifyOrder}
        open={!!verifyOrder}
        onClose={() => setVerifyOrder(null)}
      />
    </Box>
  );
}
