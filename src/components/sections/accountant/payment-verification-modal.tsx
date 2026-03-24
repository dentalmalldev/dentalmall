'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Divider,
  TextField,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CheckCircle, Warning } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { auth } from '@/lib/firebase';
import { Order } from '@/types/models';

interface PaymentVerificationModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

export function PaymentVerificationModal({ order, open, onClose }: PaymentVerificationModalProps) {
  const t = useTranslations('accountant');
  const queryClient = useQueryClient();
  const [paymentNotes, setPaymentNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/accountant/orders/${order!.id}/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ payment_notes: paymentNotes }),
      });
      if (!res.ok) throw new Error('Failed to verify payment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountant-orders'] });
      queryClient.invalidateQueries({ queryKey: ['accountant-stats'] });
      handleClose();
    },
  });

  const handleClose = () => {
    setPaymentNotes('');
    setConfirmed(false);
    verifyMutation.reset();
    onClose();
  };

  if (!order) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CheckCircle color="success" />
          <Typography variant="h6" fontWeight={600}>
            {t('confirmPaymentTitle')}
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
          {t('verifyWarning')}
        </Alert>

        {/* Order summary */}
        <Box sx={{ bgcolor: 'grey.50', borderRadius: '12px', p: 2.5, mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary">{t('orderNumber')}</Typography>
            <Typography variant="body2" fontWeight={600}>{order.order_number}</Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary">{t('customer')}</Typography>
            <Typography variant="body2" fontWeight={600}>
              {order.user?.first_name} {order.user?.last_name}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary">{t('paymentMethod')}</Typography>
            <Chip label={t('invoice')} size="small" color="info" />
          </Stack>
          <Divider sx={{ my: 1.5 }} />
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">{t('subtotal')}</Typography>
            <Typography variant="body2">₾{parseFloat(order.subtotal).toFixed(2)}</Typography>
          </Stack>
          {parseFloat(order.discount) > 0 && (
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">{t('discount')}</Typography>
              <Typography variant="body2" color="error.main">-₾{parseFloat(order.discount).toFixed(2)}</Typography>
            </Stack>
          )}
          {parseFloat(order.delivery_fee) > 0 && (
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">{t('deliveryFee')}</Typography>
              <Typography variant="body2">₾{parseFloat(order.delivery_fee).toFixed(2)}</Typography>
            </Stack>
          )}
          <Divider sx={{ my: 1.5 }} />
          <Stack direction="row" justifyContent="space-between">
            <Typography fontWeight={700}>{t('total')}</Typography>
            <Typography fontWeight={700} color="primary.main" variant="h6">
              ₾{parseFloat(order.total).toFixed(2)}
            </Typography>
          </Stack>
        </Box>

        {/* Items list */}
        {order.items && order.items.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              {t('orderItems')} ({order.items.length})
            </Typography>
            <Stack spacing={1}>
              {order.items.map((item) => (
                <Stack key={item.id} direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2">{item.product?.name}</Typography>
                    {item.variant_name && (
                      <Typography variant="caption" color="text.secondary">{item.variant_name}</Typography>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {item.quantity} × ₾{parseFloat(item.price).toFixed(2)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}

        {/* Payment notes */}
        <TextField
          label={t('paymentNotes')}
          placeholder={t('paymentNotesPlaceholder')}
          value={paymentNotes}
          onChange={(e) => setPaymentNotes(e.target.value)}
          fullWidth
          multiline
          rows={2}
          size="small"
          sx={{ mb: 2 }}
        />

        {/* Confirmation checkbox area */}
        <Alert
          severity="info"
          sx={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setConfirmed((v) => !v)}
          icon={confirmed ? <CheckCircle color="success" /> : undefined}
        >
          <Typography variant="body2">
            {confirmed ? <strong>{t('confirmedCheck')}</strong> : t('confirmCheck')}
          </Typography>
        </Alert>

        {verifyMutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {t('verifyError')}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} variant="outlined" disabled={verifyMutation.isPending}>
          {t('cancel')}
        </Button>
        <Button
          variant="contained"
          color="success"
          disabled={!confirmed || verifyMutation.isPending}
          onClick={() => verifyMutation.mutate()}
          startIcon={verifyMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
        >
          {verifyMutation.isPending ? t('verifying') : t('confirmPayment')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
