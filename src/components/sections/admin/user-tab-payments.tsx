'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Stack, Chip, CircularProgress, Alert, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton,
} from '@mui/material';
import { OpenInNew } from '@mui/icons-material';
import { useAuth } from '@/providers';
import { useTranslations } from 'next-intl';

interface PaymentOrder {
  id: string;
  order_number: string;
  total: string;
  payment_status: string;
  payment_method: string;
  invoice_url: string | null;
  created_at: string;
}

const PAYMENT_COLORS: Record<string, 'default' | 'info' | 'success' | 'error' | 'secondary' | 'warning'> = {
  PENDING: 'warning', INVOICE_SENT: 'info', PAID: 'success', FAILED: 'error', REFUNDED: 'secondary',
};

export function UserTabPayments({ userId }: { userId: string }) {
  const { user } = useAuth();
  const t = useTranslations('admin');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [byMethod, setByMethod] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await globalThis.fetch(`/api/admin/users/${userId}/payments`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setOrders(data.orders);
      setTotalPaid(data.totalPaid);
      setFailedCount(data.failedCount);
      setByMethod(data.byMethod);
    } catch { setError(t('actionFailed')); }
    finally { setLoading(false); }
  }, [user, userId, t]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <>
          {/* Summary cards */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
            <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: '10px', textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={700} color="success.main">₾{totalPaid.toFixed(2)}</Typography>
              <Typography variant="body2" color="text.secondary">{t('totalPaid')}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: '10px', textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={700} color={failedCount > 0 ? 'error.main' : 'text.primary'}>{failedCount}</Typography>
              <Typography variant="body2" color="text.secondary">{t('failedPayments')}</Typography>
            </Paper>
            {Object.entries(byMethod).map(([method, count]) => (
              <Paper key={method} variant="outlined" sx={{ flex: 1, p: 2, borderRadius: '10px', textAlign: 'center' }}>
                <Typography variant="h5" fontWeight={700}>{count}</Typography>
                <Typography variant="body2" color="text.secondary">{method}</Typography>
              </Paper>
            ))}
          </Stack>

          <Paper variant="outlined" sx={{ borderRadius: '10px', overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f6fa' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Order #</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('registrationDate')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('totalLabel')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('paymentMethodField')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('paymentStatusField')}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>{t('noOrders')}</TableCell></TableRow>
                  ) : orders.map((o) => (
                    <TableRow key={o.id} hover sx={{ bgcolor: o.payment_status === 'FAILED' ? 'rgba(244,67,54,0.04)' : 'inherit' }}>
                      <TableCell><Typography variant="body2" fontWeight={600}>{o.order_number}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{new Date(o.created_at).toLocaleDateString('ka-GE')}</Typography></TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>₾{parseFloat(o.total).toFixed(2)}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{o.payment_method}</Typography></TableCell>
                      <TableCell><Chip label={o.payment_status} color={PAYMENT_COLORS[o.payment_status] || 'default'} size="small" /></TableCell>
                      <TableCell>
                        {o.invoice_url && (
                          <IconButton size="small" href={o.invoice_url} target="_blank"><OpenInNew fontSize="small" /></IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
}
