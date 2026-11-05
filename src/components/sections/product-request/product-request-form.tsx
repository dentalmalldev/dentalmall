'use client';

import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography, useMediaQuery, useTheme } from '@mui/material';
import { User } from 'firebase/auth';
import { useTranslations } from 'next-intl';
import { colors } from '@/theme';
import { ProductRequestGrid } from './product-request-grid';
import { ProductRequestMobileForm } from './product-request-mobile-form';
import { ProductField, ProductRow } from './product-rows';
import { useProductRequestForm } from './use-product-request-form';

interface ProductRequestFormProps {
  user: User;
  onSent: () => void;
}

export function ProductRequestForm({ user, onSent }: ProductRequestFormProps) {
  const t = useTranslations('productRequest');
  const tv = useTranslations('validation');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });
  const form = useProductRequestForm(user, onSent);

  // Numbered the way this layout shows them: mobile's pages skip the blank rows.
  const visibleRows: ProductRow[] = isMobile ? form.mobileRows : form.rows;
  const invalidRows = visibleRows
    .map((row, index) => ({ number: index + 1, errors: form.rowErrors[row.id] }))
    .filter(({ errors }) => errors && Object.keys(errors).length > 0);

  return (
    <Stack gap={3}>
      <Typography variant="h4" fontWeight={700} sx={{ color: '#3E4388' }}>
        {t('title')}
      </Typography>

      {form.needsPhone && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px' }}>
          <Stack gap={2}>
            <Typography fontWeight={500}>{t('phonePrompt')}</Typography>
            <TextField
              required
              type="tel"
              label={t('phoneLabel')}
              value={form.phone}
              onChange={(event) => form.setPhone(event.target.value)}
              error={form.phoneError}
              helperText={form.phoneError ? tv('invalidPhone') : undefined}
              sx={{ maxWidth: { md: '320px' } }}
            />
          </Stack>
        </Paper>
      )}

      {isMobile ? <ProductRequestMobileForm form={form} /> : <ProductRequestGrid form={form} />}

      {(form.formError || invalidRows.length > 0) && (
        <Alert severity="error">
          {form.formError && <Box>{form.formError}</Box>}
          {invalidRows.map(({ number, errors }) => (
            <Box key={number}>
              {t('errors.rowFields', {
                number,
                fields: Object.keys(errors)
                  .map((field) => t(`fields.${field as ProductField}`))
                  .join(', '),
              })}
            </Box>
          ))}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} justifyContent="flex-end">
        {!isMobile && (
          <Button variant="outlined" onClick={form.addRows} sx={{ textTransform: 'none' }}>
            {t('addMore')}
          </Button>
        )}
        <Button
          variant="contained"
          onClick={form.send}
          disabled={form.sending}
          startIcon={form.sending ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            backgroundColor: colors.accent.main,
            '&:hover': { backgroundColor: colors.accent.hover },
          }}
        >
          {t('send')}
        </Button>
      </Stack>
    </Stack>
  );
}
