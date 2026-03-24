'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Stack, CircularProgress, Alert, Paper, IconButton,
  Tooltip, Button, Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
} from '@mui/material';
import { Delete, DeleteSweep } from '@mui/icons-material';
import { useAuth } from '@/providers';
import { useTranslations } from 'next-intl';

interface CartItemData {
  id: string;
  quantity: number;
  product: { id: string; name: string; name_ka: string; price: string; sale_price: string | null; media: { url: string }[] };
  variant_option: { name: string; price: string; sale_price: string | null } | null;
}

export function UserTabCart({ userId }: { userId: string }) {
  const { user } = useAuth();
  const t = useTranslations('admin');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CartItemData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await globalThis.fetch(`/api/admin/users/${userId}/cart`, { headers: { Authorization: `Bearer ${token}` } });
      setItems(await res.json());
    } catch { setError(t('actionFailed')); }
    finally { setLoading(false); }
  }, [user, userId, t]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const removeItem = async (itemId: string) => {
    if (!user) return;
    setRemoving(itemId);
    try {
      const token = await user.getIdToken();
      await globalThis.fetch(`/api/admin/users/${userId}/cart/${itemId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setSuccess(t('itemRemoved'));
      fetchCart();
    } catch { setError(t('actionFailed')); }
    finally { setRemoving(null); }
  };

  const clearCart = async () => {
    if (!user) return;
    setConfirmClear(false);
    try {
      const token = await user.getIdToken();
      await globalThis.fetch(`/api/admin/users/${userId}/cart`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setSuccess(t('cartCleared'));
      setItems([]);
    } catch { setError(t('actionFailed')); }
  };

  const getPrice = (item: CartItemData) => {
    const src = item.variant_option || item.product;
    return parseFloat(src.sale_price || src.price);
  };

  const cartTotal = items.reduce((sum, item) => sum + getPrice(item) * item.quantity, 0);

  return (
    <Box>
      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="body2" color="text.secondary">{items.length} {t('cartItems')} — <strong>₾{cartTotal.toFixed(2)}</strong></Typography>
            {items.length > 0 && (
              <Button size="small" color="error" variant="outlined" startIcon={<DeleteSweep />} onClick={() => setConfirmClear(true)} sx={{ borderRadius: '8px' }}>
                {t('clearCart')}
              </Button>
            )}
          </Stack>

          {items.length === 0 ? (
            <Typography color="text.secondary" variant="body2">{t('cartEmpty')}</Typography>
          ) : (
            <Stack spacing={1.5}>
              {items.map((item) => (
                <Paper key={item.id} variant="outlined" sx={{ p: 1.5, borderRadius: '10px' }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                      src={item.product.media[0]?.url}
                      variant="rounded"
                      sx={{ width: 48, height: 48, bgcolor: '#f5f6fa', borderRadius: '8px' }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>{item.product.name}</Typography>
                      {item.variant_option && <Typography variant="caption" color="text.secondary">{item.variant_option.name}</Typography>}
                      <Typography variant="caption" color="text.secondary" display="block">× {item.quantity}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={600}>₾{(getPrice(item) * item.quantity).toFixed(2)}</Typography>
                    <Tooltip title={t('delete')}>
                      <IconButton size="small" color="error" onClick={() => removeItem(item.id)} disabled={removing === item.id}>
                        {removing === item.id ? <CircularProgress size={16} /> : <Delete fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </>
      )}

      <Dialog open={confirmClear} onClose={() => setConfirmClear(false)} maxWidth="xs" fullWidth>
        <DialogTitle color="error">{t('clearCart')}</DialogTitle>
        <DialogContent><Typography variant="body2">{t('clearCartConfirm')}</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClear(false)}>{t('cancel')}</Button>
          <Button variant="contained" color="error" onClick={clearCart}>{t('clearCart')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
