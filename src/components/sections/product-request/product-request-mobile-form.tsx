'use client';

import { Box, Button, FormHelperText, Stack, TextField as MuiTextField, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import { MAX_DESCRIPTION_LENGTH, MAX_PHOTO_SIZE_MB } from '@/lib/validations/product-request';
import { PhotoField } from './photo-field';
import { REQUIRED_FIELDS, TEXT_FIELD_LIMITS, TextField } from './product-rows';
import type { ProductRequestFormState } from './use-product-request-form';

export function ProductRequestMobileForm({ form }: { form: ProductRequestFormState }) {
  const t = useTranslations('productRequest');
  const tRoot = useTranslations();

  const row = form.mobileRows[form.activeIndex];
  const errors = form.rowErrors[row.id] ?? {};
  const message = (key?: string) => (key ? tRoot(key, { max: MAX_PHOTO_SIZE_MB }) : undefined);

  const textField = (field: TextField, multiline = false) => (
    <MuiTextField
      fullWidth
      required={REQUIRED_FIELDS.includes(field)}
      multiline={multiline}
      minRows={multiline ? 3 : undefined}
      label={t(`fields.${field}`)}
      value={row[field]}
      onChange={(event) => form.updateRow(row.id, { [field]: event.target.value })}
      error={Boolean(errors[field])}
      helperText={
        message(errors[field]) ??
        (field === 'description' ? `${row.description.length} / ${MAX_DESCRIPTION_LENGTH}` : undefined)
      }
      slotProps={{ htmlInput: { maxLength: TEXT_FIELD_LIMITS[field] } }}
    />
  );

  return (
    <Stack gap={2.5}>
      <Typography fontWeight={600} sx={{ color: '#3E4388' }}>
        {t('counter', { current: form.activeIndex + 1, total: form.mobileRows.length })}
      </Typography>

      {textField('name')}
      {textField('invoice_name')}
      {textField('description', true)}
      {textField('estimated_price')}
      {textField('store')}

      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {t('fields.photo_url')} ({t('photoHint', { max: MAX_PHOTO_SIZE_MB })})
        </Typography>
        <PhotoField
          url={row.photo_url}
          uploading={form.uploadingIds.includes(row.id)}
          onChoose={(file) => form.choosePhoto(row.id, file)}
          onRemove={() => form.updateRow(row.id, { photo_url: null })}
        />
        {errors.photo_url && <FormHelperText error>{message(errors.photo_url)}</FormHelperText>}
      </Box>

      <MuiTextField
        fullWidth
        required
        label={t('fields.quantity')}
        value={row.quantity}
        onChange={(event) => form.updateRow(row.id, { quantity: event.target.value.replace(/\D/g, '') })}
        error={Boolean(errors.quantity)}
        helperText={message(errors.quantity)}
        slotProps={{ htmlInput: { inputMode: 'numeric' } }}
      />

      <Stack direction="row" gap={1.5}>
        <Button
          variant="outlined"
          disabled={form.activeIndex === 0}
          onClick={form.goToPrevious}
          sx={{ textTransform: 'none', flex: 1 }}
        >
          {t('previous')}
        </Button>
        <Button variant="outlined" onClick={form.goToNext} sx={{ textTransform: 'none', flex: 2 }}>
          {t('nextProduct')}
        </Button>
      </Stack>
    </Stack>
  );
}
