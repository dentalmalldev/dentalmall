'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { Add, Close, Remove } from '@mui/icons-material';
import { useLocale, useTranslations } from 'next-intl';
import { useCart, useSnackbar } from '@/providers';
import { isInsufficientStockError } from '@/services';
import { getProductDisplayPricing, getVariantOptionPricing } from '@/lib/product-pricing';
import type { PurchasedProductEntry, VariantOption } from '@/types/models';

interface PurchaseAgainDialogProps {
  entry: PurchasedProductEntry;
  open: boolean;
  onClose: () => void;
}

/**
 * Quantity (default 1) and variant (the one bought, preselected) for adding a
 * purchased product to the cart again. The add goes through the cart's own
 * API, so it meets the same checks as any other add.
 */
export function PurchaseAgainDialog({ entry, open, onClose }: PurchaseAgainDialogProps) {
  const t = useTranslations('purchasedProducts');
  const tp = useTranslations('productsSection');
  const tDetail = useTranslations('productDetail');
  const locale = useLocale();
  const { addToCart } = useCart();
  const { showSnackbar } = useSnackbar();

  const { product } = entry;
  const variantTypes = product.variant_types.filter((vt) => (vt.options?.length ?? 0) > 0);
  const options = variantTypes.flatMap((vt) => vt.options);
  const hasVariants = options.length > 0;
  // Special-order items are sourced on demand, so stock doesn't cap them.
  const stockCapped = product.in_storage_stock;

  // A bought option that was deleted since leaves nothing preselected.
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    options.some((o) => o.id === entry.variant_option_id) ? entry.variant_option_id : null
  );
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);

  const selected = options.find((o) => o.id === selectedId) ?? null;
  const needsVariant = hasVariants && !selected;
  const stock = hasVariants ? (selected?.stock ?? 0) : product.stock;
  const maxQuantity = stockCapped ? stock : Infinity;

  const getName = (item: { name: string; name_ka: string }) => (locale === 'ka' ? item.name_ka : item.name);
  const isOptionDisabled = (o: VariantOption) => stockCapped && o.stock <= 0;

  const unitPricing = selected
    ? getVariantOptionPricing(selected)
    : hasVariants
      ? null
      : (() => {
          const p = getProductDisplayPricing(product);
          return { price: p.minPrice, originalPrice: p.minOriginalPrice };
        })();

  const handleSelect = (option: VariantOption) => {
    setSelectedId(option.id);
    if (stockCapped) setQuantity((q) => Math.max(1, Math.min(q, option.stock)));
  };

  const changeQuantity = (delta: number) => {
    setQuantity((q) => Math.max(1, Math.min(q + delta, maxQuantity)));
  };

  const handleAdd = async () => {
    setBusy(true);
    try {
      await addToCart(product.id, quantity, selected?.id);
      showSnackbar(tp('addedToCart'));
      onClose();
    } catch (error) {
      showSnackbar(isInsufficientStockError(error) ? tp('notEnoughStock') : tp('addToCartError'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const firstTypeLabel = variantTypes[0] ? getName(variantTypes[0]) : '';
  const canAdd = !needsVariant && quantity >= 1 && quantity <= maxQuantity && !busy;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ pr: 5, fontWeight: 700, color: '#2C2957', overflowWrap: 'anywhere' }}>
        {getName(product)}
        <IconButton
          aria-label={tDetail('goBack')}
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: '#6B7280' }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {variantTypes.map((variantType) => (
          <Box key={variantType.id} sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1, color: '#2C2957' }}>
              {getName(variantType)}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {variantType.options.map((option) => {
                const isSelected = option.id === selectedId;
                return (
                  <Chip
                    key={option.id}
                    label={getName(option)}
                    onClick={() => handleSelect(option)}
                    disabled={isOptionDisabled(option)}
                    variant={isSelected ? 'filled' : 'outlined'}
                    color={isSelected ? 'primary' : 'default'}
                    sx={{ fontWeight: isSelected ? 600 : 400, borderRadius: '8px', px: 1 }}
                  />
                );
              })}
            </Stack>
          </Box>
        ))}

        <Typography variant="body2" fontWeight={600} sx={{ mb: 1, color: '#2C2957' }}>
          {tDetail('quantity')}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Paper variant="outlined" sx={{ display: 'flex', alignItems: 'center', borderRadius: '8px', overflow: 'hidden' }}>
            <IconButton
              aria-label={t('decrease')}
              onClick={() => changeQuantity(-1)}
              disabled={quantity <= 1}
              sx={{ borderRadius: 0 }}
            >
              <Remove />
            </IconButton>
            <Typography sx={{ px: 3, py: 1, minWidth: 50, textAlign: 'center', fontWeight: 600 }}>
              {quantity}
            </Typography>
            <IconButton
              aria-label={t('increase')}
              onClick={() => changeQuantity(1)}
              disabled={needsVariant || quantity >= maxQuantity}
              sx={{ borderRadius: 0 }}
            >
              <Add />
            </IconButton>
          </Paper>
          {stockCapped && !needsVariant && (
            <Typography variant="caption" color="text.secondary">
              {t('available', { count: stock })}
            </Typography>
          )}
        </Stack>

        {unitPricing && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #E5E7EB' }}>
            <Stack direction="row" alignItems="baseline" spacing={1.5}>
              <Typography variant="h5" sx={{ fontSize: '22px', fontWeight: 700, color: '#3E4388' }}>
                {(unitPricing.price * quantity).toFixed(2)}₾
              </Typography>
              {unitPricing.originalPrice !== null && (
                <Typography variant="body2" sx={{ fontSize: '14px', color: '#3E438866', textDecoration: 'line-through' }}>
                  {(unitPricing.originalPrice * quantity).toFixed(2)}₾
                </Typography>
              )}
            </Stack>
            {quantity > 1 && (
              <Typography variant="caption" color="text.secondary">
                {unitPricing.price.toFixed(2)}₾ × {quantity}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#6B7280' }}>
          {tDetail('goBack')}
        </Button>
        <Button
          variant="contained"
          disabled={!canAdd}
          onClick={handleAdd}
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            backgroundColor: '#5B6ECD',
            '&:hover': { backgroundColor: '#4A5BC0' },
          }}
        >
          {needsVariant
            ? firstTypeLabel
              ? tDetail('selectVariantPrompt', { name: firstTypeLabel })
              : tDetail('selectVariantGeneric')
            : tp('addToCart')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
