'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Stack, CircularProgress, Alert, Chip, Button,
  FormControl, InputLabel, Select, MenuItem, Paper,
} from '@mui/material';
import {
  ShoppingCart, AdminPanelSettings, Email, Block, Delete as DeleteIcon,
  Refresh, AttachMoney, ClearAll,
} from '@mui/icons-material';
import { useAuth } from '@/providers';
import { useTranslations } from 'next-intl';

interface ActivityEvent {
  id: string;
  type: string;
  label: string;
  details: string;
  created_at: string;
}

const EVENT_ICON: Record<string, React.ReactNode> = {
  ORDER_PLACED: <ShoppingCart fontSize="small" />,
  EMAIL_SENT: <Email fontSize="small" />,
  ROLE_CHANGE: <AdminPanelSettings fontSize="small" />,
  DISABLE: <Block fontSize="small" />,
  DELETE: <DeleteIcon fontSize="small" />,
  REFUND_ISSUED: <AttachMoney fontSize="small" />,
  CART_CLEAR: <ClearAll fontSize="small" />,
  CART_ITEM_REMOVE: <ClearAll fontSize="small" />,
};

const EVENT_COLOR: Record<string, 'default' | 'primary' | 'error' | 'warning' | 'success' | 'secondary'> = {
  ORDER_PLACED: 'primary',
  EMAIL_SENT: 'secondary',
  ROLE_CHANGE: 'warning',
  REFUND_ISSUED: 'success',
  DISABLE: 'error',
  DELETE: 'error',
  CART_CLEAR: 'default',
  CART_ITEM_REMOVE: 'default',
};

export function UserTabActivity({ userId }: { userId: string }) {
  const { user } = useAuth();
  const t = useTranslations('admin');
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await globalThis.fetch(`/api/admin/users/${userId}/activity`, { headers: { Authorization: `Bearer ${token}` } });
      setEvents(await res.json());
    } catch { setError(t('actionFailed')); }
    finally { setLoading(false); }
  }, [user, userId, t]);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = typeFilter ? events.filter((e) => e.type === typeFilter) : events;

  const uniqueTypes = [...new Set(events.map((e) => e.type))];

  const exportCSV = () => {
    const rows = filtered.map((e) => [new Date(e.created_at).toLocaleString(), e.type, e.details].join(','));
    const csv = ['Date,Type,Details', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `activity-${userId}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} mb={2} alignItems="center" justifyContent="space-between">
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>{t('activityType')}</InputLabel>
          <Select value={typeFilter} label={t('activityType')} onChange={(e) => setTypeFilter(e.target.value)}>
            <MenuItem value="">{t('allTime')}</MenuItem>
            {uniqueTypes.map((type) => <MenuItem key={type} value={type}>{type.replace(/_/g, ' ')}</MenuItem>)}
          </Select>
        </FormControl>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={exportCSV} sx={{ borderRadius: '8px' }}>{t('exportCsv')}</Button>
          <Button size="small" onClick={fetch} startIcon={<Refresh />} sx={{ borderRadius: '8px' }}>{t('refresh') || 'Refresh'}</Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Typography color="text.secondary" variant="body2">{t('noActivity')}</Typography>
      ) : (
        <Stack spacing={1}>
          {filtered.map((event) => (
            <Paper key={event.id} variant="outlined" sx={{ p: 1.5, borderRadius: '10px' }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ color: `${EVENT_COLOR[event.type] || 'default'}.main` }}>
                  {EVENT_ICON[event.type] || <AdminPanelSettings fontSize="small" />}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={event.type.replace(/_/g, ' ')} size="small" color={EVENT_COLOR[event.type] || 'default'} sx={{ fontWeight: 600, fontSize: 11 }} />
                    {event.details && <Typography variant="body2" color="text.secondary">{event.details}</Typography>}
                  </Stack>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                  {new Date(event.created_at).toLocaleString('ka-GE')}
                </Typography>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
