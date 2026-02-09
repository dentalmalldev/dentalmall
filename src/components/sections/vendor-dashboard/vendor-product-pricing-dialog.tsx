'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Box,
  Divider,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { useFormik } from 'formik';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/providers';
import { vendorService, VendorProductPricingUpdate } from '@/services';
import { Product } from '@/types/models';

interface VendorProductPricingDialogProps {
  product: Product;
  open: boolean;
  onClose: () => void;
}

export function VendorProductPricingDialog({
  product,
  open,
  onClose,
}: VendorProductPricingDialogProps) {
  const t = useTranslations('vendorDashboard');
  const locale = useLocale();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const getName = () => (locale === 'ka' ? product.name_ka : product.name);
  const getVariantName = (v: { name: string; name_ka: string }) =>
    locale === 'ka' ? v.name_ka : v.name;

  const updateMutation = useMutation({
    mutationFn: async (data: VendorProductPricingUpdate) => {
      if (!user) throw new Error('Not authenticated');
      return vendorService.updateProductPricing(user, product.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor', 'dashboard'] });
      onClose();
    },
  });

  const formik = useFormik({
    initialValues: {
      price: parseFloat(product.price),
      sale_price: product.sale_price ? parseFloat(product.sale_price) : '',
      discount_percent: product.discount_percent ?? '',
      variants: (product.variants || []).map((v) => ({
        id: v.id,
        name: v.name,
        name_ka: v.name_ka,
        price: parseFloat(v.price),
        sale_price: v.sale_price ? parseFloat(v.sale_price) : '',
        discount_percent: v.discount_percent ?? '',
      })),
    },
    onSubmit: (values) => {
      const data: VendorProductPricingUpdate = {
        price: values.price,
        sale_price: values.sale_price === '' ? null : Number(values.sale_price),
        discount_percent:
          values.discount_percent === '' ? null : Number(values.discount_percent),
      };

      if (values.variants.length > 0) {
        data.variants = values.variants.map((v) => ({
          id: v.id,
          price: v.price,
          sale_price: v.sale_price === '' ? null : Number(v.sale_price),
          discount_percent:
            v.discount_percent === '' ? null : Number(v.discount_percent),
        }));
      }

      updateMutation.mutate(data);
    },
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: '16px' } }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        {t('editPricingTitle')} — {getName()}
      </DialogTitle>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          {/* Product pricing */}
          <Stack spacing={2.5}>
            <TextField
              label={t('price')}
              name="price"
              type="number"
              value={formik.values.price}
              onChange={formik.handleChange}
              required
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">₾</InputAdornment>,
              }}
              inputProps={{ step: '0.01', min: '0.01' }}
            />
            <TextField
              label={t('salePrice')}
              name="sale_price"
              type="number"
              value={formik.values.sale_price}
              onChange={formik.handleChange}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">₾</InputAdornment>,
              }}
              inputProps={{ step: '0.01', min: '0' }}
            />
            <TextField
              label={t('discountPercent')}
              name="discount_percent"
              type="number"
              value={formik.values.discount_percent}
              onChange={formik.handleChange}
              fullWidth
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              inputProps={{ min: '0', max: '100' }}
            />
          </Stack>

          {/* Variant pricing */}
          {formik.values.variants.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                {t('variants')}
              </Typography>
              <Stack spacing={3}>
                {formik.values.variants.map((variant, index) => (
                  <Box
                    key={variant.id}
                    sx={{
                      p: 2,
                      borderRadius: '12px',
                      bgcolor: '#f8f9fa',
                    }}
                  >
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
                      {t('variant')}: {getVariantName(variant)}
                    </Typography>
                    <Stack spacing={2}>
                      <TextField
                        label={t('price')}
                        name={`variants[${index}].price`}
                        type="number"
                        value={variant.price}
                        onChange={formik.handleChange}
                        required
                        fullWidth
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">₾</InputAdornment>
                          ),
                        }}
                        inputProps={{ step: '0.01', min: '0.01' }}
                      />
                      <TextField
                        label={t('salePrice')}
                        name={`variants[${index}].sale_price`}
                        type="number"
                        value={variant.sale_price}
                        onChange={formik.handleChange}
                        fullWidth
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">₾</InputAdornment>
                          ),
                        }}
                        inputProps={{ step: '0.01', min: '0' }}
                      />
                      <TextField
                        label={t('discountPercent')}
                        name={`variants[${index}].discount_percent`}
                        type="number"
                        value={variant.discount_percent}
                        onChange={formik.handleChange}
                        fullWidth
                        size="small"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">%</InputAdornment>
                          ),
                        }}
                        inputProps={{ min: '0', max: '100' }}
                      />
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </>
          )}

          {updateMutation.isError && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {updateMutation.error?.message}
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={onClose}
            sx={{ borderRadius: '8px', textTransform: 'none' }}
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={updateMutation.isPending}
            startIcon={
              updateMutation.isPending ? <CircularProgress size={16} /> : undefined
            }
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
          >
            {t('save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
