'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Stack,
  TextField,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Avatar,
  TablePagination,
} from '@mui/material';
import {
  Inventory,
  LocalShipping,
  CheckCircle,
  Phone,
  LocationOn,
  Person,
  Notes,
} from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { Order, PaginatedResponse } from '@/types/models';

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  PROCESSING: { color: '#ef4444', icon: <Inventory /> },
  READY_FOR_DELIVERY: { color: '#f59e0b', icon: <LocalShipping /> },
  OUT_FOR_DELIVERY: { color: '#6366f1', icon: <LocalShipping /> },
  DELIVERED: { color: '#22c55e', icon: <CheckCircle /> },
};

interface ActionModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  action: 'prepare' | 'ship' | 'deliver';
}

function ActionModal({ order, open, onClose, action }: ActionModalProps) {
  const t = useTranslations('storage');
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');

  const endpoints: Record<string, string> = {
    prepare: 'prepare',
    ship: 'ship',
    deliver: 'deliver',
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/storage/orders/${order!.id}/${endpoints[action]}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ warehouse_notes: notes || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-orders'] });
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
      setNotes('');
      onClose();
    },
  });

  if (!order) return null;

  const actionLabels: Record<string, string> = {
    prepare: t('markReady'),
    ship: t('markShipped'),
    deliver: t('markDelivered'),
  };

  const actionColors: Record<string, 'warning' | 'info' | 'success'> = {
    prepare: 'warning',
    ship: 'info',
    deliver: 'success',
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        {actionLabels[action]} — {order.order_number}
      </DialogTitle>
      <DialogContent>
        {/* Order summary */}
        <Box sx={{ bgcolor: 'grey.50', borderRadius: '12px', p: 2.5, mb: 3 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">{t('customer')}</Typography>
              <Typography variant="body2" fontWeight={600}>
                {order.user?.first_name} {order.user?.last_name}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">{t('items')}</Typography>
              <Typography variant="body2" fontWeight={600}>
                {order.items?.length ?? 0} {t('products')}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">{t('total')}</Typography>
              <Typography variant="body2" fontWeight={700} color="primary.main">
                ₾{parseFloat(order.total).toFixed(2)}
              </Typography>
            </Stack>
          </Stack>
        </Box>

        {/* Items */}
        {order.items && order.items.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              {t('orderItems')}
            </Typography>
            <Stack spacing={1}>
              {order.items.map((item) => (
                <Stack key={item.id} direction="row" alignItems="center" spacing={1.5}>
                  {item.product?.media?.[0] && (
                    <Avatar
                      src={item.product.media[0].url}
                      variant="rounded"
                      sx={{ width: 40, height: 40 }}
                    />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2">{item.product?.name}</Typography>
                    {item.variant_name && (
                      <Typography variant="caption" color="text.secondary">{item.variant_name}</Typography>
                    )}
                  </Box>
                  <Typography variant="body2" fontWeight={600}>×{item.quantity}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}

        {/* Warehouse notes */}
        <TextField
          label={t('warehouseNotes')}
          placeholder={t('warehouseNotesPlaceholder')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          fullWidth
          multiline
          rows={2}
          size="small"
        />

        {mutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {(mutation.error as Error).message}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined" disabled={mutation.isPending}>
          {t('cancel')}
        </Button>
        <Button
          variant="contained"
          color={actionColors[action]}
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
          startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {mutation.isPending ? t('updating') : actionLabels[action]}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Order card component
function OrderCard({ order, t, onAction }: {
  order: Order;
  t: (key: string) => string;
  onAction: (order: Order, action: 'prepare' | 'ship' | 'deliver') => void;
}) {
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PROCESSING;

  const nextAction: Record<string, 'prepare' | 'ship' | 'deliver' | null> = {
    PROCESSING: 'prepare',
    READY_FOR_DELIVERY: 'ship',
    OUT_FOR_DELIVERY: 'deliver',
    DELIVERED: null,
  };

  const action = nextAction[order.status];

  const actionLabels: Record<string, string> = {
    prepare: t('markReady'),
    ship: t('markShipped'),
    deliver: t('markDelivered'),
  };

  const actionColors: Record<string, 'warning' | 'info' | 'success'> = {
    prepare: 'warning',
    ship: 'info',
    deliver: 'success',
  };

  return (
    <Paper
      sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      elevation={0}
    >
      {/* Header bar */}
      <Box sx={{ bgcolor: `${config.color}10`, px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" fontWeight={700} fontFamily="monospace">
            {order.order_number}
          </Typography>
          <Chip
            label={t(`status.${order.status}`)}
            size="small"
            sx={{ bgcolor: config.color, color: 'white', fontWeight: 600 }}
          />
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Box>

      {/* Body */}
      <Box sx={{ p: 2.5, flex: 1 }}>
        {/* Customer */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="body2" fontWeight={600}>
            {order.user?.first_name} {order.user?.last_name}
          </Typography>
        </Stack>

        {/* Address */}
        {order.address && (
          <>
            <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 0.5 }}>
              <LocationOn sx={{ fontSize: 18, color: 'text.secondary', mt: 0.2 }} />
              <Typography variant="body2" color="text.secondary">
                {order.address.city}, {order.address.address}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <Phone sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {order.address.mobile_number}
              </Typography>
            </Stack>
          </>
        )}

        <Divider sx={{ my: 1.5 }} />

        {/* Items */}
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          {t('items')} ({order.items?.length ?? 0})
        </Typography>
        <Stack spacing={0.75} sx={{ mt: 0.75 }}>
          {order.items?.slice(0, 3).map((item) => (
            <Stack key={item.id} direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" noWrap sx={{ maxWidth: '70%' }}>
                {item.product?.name}
              </Typography>
              <Typography variant="body2" fontWeight={600}>×{item.quantity}</Typography>
            </Stack>
          ))}
          {(order.items?.length ?? 0) > 3 && (
            <Typography variant="caption" color="text.secondary">
              +{(order.items?.length ?? 0) - 3} {t('moreItems')}
            </Typography>
          )}
        </Stack>

        {/* Warehouse notes */}
        {order.warehouse_notes && (
          <Stack direction="row" spacing={0.5} sx={{ mt: 1.5 }}>
            <Notes sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {order.warehouse_notes}
            </Typography>
          </Stack>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ px: 2.5, pb: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: action ? 1.5 : 0 }}>
          <Typography variant="body2" color="text.secondary">{t('total')}</Typography>
          <Typography variant="h6" fontWeight={700} color="primary.main">
            ₾{parseFloat(order.total).toFixed(2)}
          </Typography>
        </Stack>

        {action && (
          <Button
            variant="contained"
            fullWidth
            color={actionColors[action]}
            onClick={() => onAction(order, action)}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
          >
            {actionLabels[action]}
          </Button>
        )}
      </Box>
    </Paper>
  );
}

export function StorageOrders() {
  const t = useTranslations('storage');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<string>(tabParam || 'to_prepare');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [actionOrder, setActionOrder] = useState<Order | null>(null);
  const [actionType, setActionType] = useState<'prepare' | 'ship' | 'deliver'>('prepare');

  useEffect(() => {
    const tab = tabParam || 'to_prepare';
    setActiveTab(tab);
    setPage(0);
  }, [tabParam]);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', String(page + 1));
    params.set('limit', String(rowsPerPage));
    params.set('tab', activeTab);
    if (search) params.set('search', search);
    return params.toString();
  }, [activeTab, search, page, rowsPerPage]);

  const { data, isLoading, isError } = useQuery<PaginatedResponse<Order>>({
    queryKey: ['storage-orders', activeTab, search, page, rowsPerPage],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/storage/orders?${buildQuery()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(0);
    router.push(`/${locale}/storage/orders?tab=${tab}`, { scroll: false });
  };

  const handleAction = (order: Order, action: 'prepare' | 'ship' | 'deliver') => {
    setActionOrder(order);
    setActionType(action);
  };

  const TABS = [
    { key: 'to_prepare', label: t('tabToPrepare'), color: '#ef4444' },
    { key: 'ready', label: t('tabReady'), color: '#f59e0b' },
    { key: 'out', label: t('tabOut'), color: '#6366f1' },
    { key: 'delivered', label: t('tabDelivered'), color: '#22c55e' },
  ];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{t('ordersTitle')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('ordersSubtitle')}</Typography>
        </Box>
        <TextField
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: 250 }}
        />
      </Stack>

      {/* Tabs */}
      <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
        {TABS.map((tab) => (
          <Chip
            key={tab.key}
            label={tab.label}
            onClick={() => handleTabChange(tab.key)}
            sx={{
              cursor: 'pointer',
              fontWeight: 600,
              ...(activeTab === tab.key
                ? { bgcolor: tab.color, color: 'white' }
                : { bgcolor: 'transparent', border: '1px solid', borderColor: 'divider' }),
            }}
          />
        ))}
      </Stack>

      {/* Orders grid */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error">{t('loadError')}</Alert>
      ) : !data?.data?.length ? (
        <Paper sx={{ textAlign: 'center', py: 8, borderRadius: '16px' }} elevation={0}>
          <Typography color="text.secondary" variant="h6">{t('noOrders')}</Typography>
          <Typography color="text.secondary" variant="body2">{t('noOrdersDesc')}</Typography>
        </Paper>
      ) : (
        <>
          <Grid container spacing={2.5}>
            {data.data.map((order) => (
              <Grid key={order.id} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
                <OrderCard order={order} t={t} onAction={handleAction} />
              </Grid>
            ))}
          </Grid>
          <TablePagination
            component="div"
            count={data.total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
            rowsPerPageOptions={[12, 24, 48]}
            labelRowsPerPage={t('perPage')}
          />
        </>
      )}

      <ActionModal
        order={actionOrder}
        open={!!actionOrder}
        onClose={() => setActionOrder(null)}
        action={actionType}
      />
    </Box>
  );
}
