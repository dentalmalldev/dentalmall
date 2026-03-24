'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Stack, Chip, CircularProgress, Alert, Paper,
  Select, MenuItem, FormControl, InputLabel, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, RadioGroup,
  FormControlLabel, Radio,
} from '@mui/material';
import { AttachMoney } from '@mui/icons-material';
import { useAuth } from '@/providers';
import { useTranslations } from 'next-intl';

interface PaidOrder {
  id: string;
  order_number: string;
  total: string;
  payment_status: string;
  created_at: string;
}

interface Refund {
  id: string;
  amount: string;
  type: string;
  reason: string;
  admin_notes: string | null;
  created_at: string;
  order: { order_number: string; total: string };
}

const REASONS = ['Damaged product', 'Wrong item delivered', 'Customer request', 'Duplicate order', 'Other'];

export function UserTabRefund({ userId }: { userId: string }) {
  const { user } = useAuth();
  const t = useTranslations('admin');
  const [loading, setLoading] = useState(true);
  const [paidOrders, setPaidOrders] = useState<PaidOrder[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [refundType, setRefundType] = useState<'FULL' | 'PARTIAL'>('FULL');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const [ordersRes, refundsRes] = await Promise.all([
        globalThis.fetch(`/api/admin/users/${userId}/payments`, { headers: { Authorization: `Bearer ${token}` } }),
        globalThis.fetch(`/api/admin/users/${userId}/refunds`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const ordersData = await ordersRes.json();
      const refundsData = await refundsRes.json();
      setPaidOrders((ordersData.orders || []).filter((o: PaidOrder) => o.payment_status === 'PAID'));
      setRefunds(refundsData);
    } catch { setError(t('actionFailed')); }
    finally { setLoading(false); }
  }, [user, userId, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selectedOrder = paidOrders.find((o) => o.id === selectedOrderId);
  const orderTotal = selectedOrder ? parseFloat(selectedOrder.total) : 0;
  const refundAmount = refundType === 'FULL' ? orderTotal : parseFloat(amount || '0');

  const handleRefund = async () => {
    if (!user) return;
    setConfirmOpen(false);
    setProcessing(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await globalThis.fetch(`/api/admin/users/${userId}/refund`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: selectedOrderId, type: refundType, amount: refundAmount, reason, admin_notes: adminNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('actionFailed'));
      setSuccess(t('refundSuccess'));
      setSelectedOrderId(''); setAmount(''); setReason(''); setAdminNotes('');
      fetchData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('actionFailed'));
    } finally {
      setProcessing(false);
    }
  };

  const canSubmit = selectedOrderId && reason && (refundType === 'FULL' || (parseFloat(amount) > 0 && parseFloat(amount) <= orderTotal));

  return (
    <Box>
      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <>
          {paidOrders.length === 0 ? (
            <Alert severity="info">{t('noRefundableOrders')}</Alert>
          ) : (
            <Stack spacing={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('selectOrder')}</InputLabel>
                <Select value={selectedOrderId} label={t('selectOrder')} onChange={(e) => setSelectedOrderId(e.target.value)}>
                  {paidOrders.map((o) => (
                    <MenuItem key={o.id} value={o.id}>
                      {o.order_number} — ₾{parseFloat(o.total).toFixed(2)} ({new Date(o.created_at).toLocaleDateString()})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedOrder && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '10px' }}>
                  <Typography variant="body2" color="text.secondary">{t('orderTotal')}: <strong>₾{orderTotal.toFixed(2)}</strong></Typography>
                </Paper>
              )}

              <Box>
                <Typography variant="body2" fontWeight={600} mb={1}>{t('refundType')}</Typography>
                <RadioGroup row value={refundType} onChange={(e) => setRefundType(e.target.value as 'FULL' | 'PARTIAL')}>
                  <FormControlLabel value="FULL" control={<Radio size="small" />} label={t('fullRefund')} />
                  <FormControlLabel value="PARTIAL" control={<Radio size="small" />} label={t('partialRefund')} />
                </RadioGroup>
              </Box>

              {refundType === 'PARTIAL' && (
                <TextField
                  fullWidth size="small" label={t('refundAmount')} value={amount} type="number"
                  onChange={(e) => setAmount(e.target.value)}
                  inputProps={{ min: 0.01, max: orderTotal, step: 0.01 }}
                  helperText={orderTotal > 0 ? `${t('max')}: ₾${orderTotal.toFixed(2)}` : ''}
                />
              )}

              <FormControl fullWidth size="small">
                <InputLabel>{t('refundReason')}</InputLabel>
                <Select value={reason} label={t('refundReason')} onChange={(e) => setReason(e.target.value)}>
                  {REASONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </Select>
              </FormControl>

              <TextField fullWidth size="small" multiline rows={2} label={t('adminNotes')} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />

              <Button
                variant="contained" color="warning"
                startIcon={processing ? <CircularProgress size={18} color="inherit" /> : <AttachMoney />}
                onClick={() => setConfirmOpen(true)}
                disabled={!canSubmit || processing}
                sx={{ borderRadius: '8px', alignSelf: 'flex-start' }}
              >
                {t('issueRefund')} {canSubmit ? `— ₾${refundAmount.toFixed(2)}` : ''}
              </Button>
            </Stack>
          )}

          {/* Refund History */}
          {refunds.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle2" fontWeight={600} mb={2}>{t('refundHistory')}</Typography>
              <Stack spacing={1}>
                {refunds.map((r) => (
                  <Paper key={r.id} variant="outlined" sx={{ p: 2, borderRadius: '10px' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                          <Typography variant="body2" fontWeight={600}>{r.order.order_number}</Typography>
                          <Chip label={r.type} size="small" color="warning" />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">{r.reason}</Typography>
                        {r.admin_notes && <Typography variant="caption" color="text.secondary">{r.admin_notes}</Typography>}
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body1" fontWeight={700} color="warning.main">₾{parseFloat(r.amount).toFixed(2)}</Typography>
                        <Typography variant="caption" color="text.secondary">{new Date(r.created_at).toLocaleDateString('ka-GE')}</Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </>
          )}
        </>
      )}

      {/* Confirm Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('confirmRefund')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {t('refundConfirmMsg', { amount: `₾${refundAmount.toFixed(2)}`, order: selectedOrder?.order_number || '' })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>{t('cancel')}</Button>
          <Button variant="contained" color="warning" onClick={handleRefund}>{t('confirm')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
