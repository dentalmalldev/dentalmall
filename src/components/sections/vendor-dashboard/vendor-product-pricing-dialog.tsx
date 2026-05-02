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
  const hasVariants = (product.variant_types?.some((vt) => (vt.options?.length ?? 0) > 0)) ?? false;

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
      variant_options: (product.variant_types || []).flatMap((vt) =>
        (vt.options ?? []).map((o) => ({
          id: o.id,
          name: o.name,
          name_ka: o.name_ka,
          price: parseFloat(o.price),
        }))
      ),
    },
    onSubmit: (values) => {
      const data: VendorProductPricingUpdate = {
        price: values.price,
      };

      if (values.variant_options.length > 0) {
        data.variant_options = values.variant_options.map((v) => ({
          id: v.id,
          price: v.price,
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
          {/* Vendor's cost price (the only thing vendors can edit; admin sets DentalMall price + sale price) */}
          <Stack spacing={2.5}>
            <TextField
              label={t('price')}
              name="price"
              type="number"
              value={formik.values.price}
              onChange={formik.handleChange}
              required={!hasVariants}
              fullWidth
              disabled={hasVariants}
              helperText={hasVariants ? t('priceFromVariantsHelper') : ''}
              InputProps={{
                startAdornment: <InputAdornment position="start">₾</InputAdornment>,
              }}
              inputProps={{ step: '0.01', min: '0.01' }}
            />
          </Stack>

          {/* Variant option pricing */}
          {formik.values.variant_options.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                {t('variants')}
              </Typography>
              <Stack spacing={3}>
                {formik.values.variant_options.map((option, index) => (
                  <Box
                    key={option.id}
                    sx={{
                      p: 2,
                      borderRadius: '12px',
                      bgcolor: '#f8f9fa',
                    }}
                  >
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
                      {t('variant')}: {getVariantName(option)}
                    </Typography>
                    <TextField
                      label={t('price')}
                      name={`variant_options[${index}].price`}
                      type="number"
                      value={option.price}
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
