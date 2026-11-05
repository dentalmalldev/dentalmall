'use client';

import { ChangeEvent } from 'react';
import { Box, Button, CircularProgress, IconButton, Stack, Tooltip } from '@mui/material';
import { Close as RemoveIcon, PhotoCamera as PhotoIcon } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { ALLOWED_PHOTO_TYPES } from '@/lib/validations/product-request';

interface PhotoFieldProps {
  url: string | null;
  uploading: boolean;
  /** Desktop grid cell instead of the full-width mobile field. */
  compact?: boolean;
  onChoose: (file: File) => void;
  onRemove: () => void;
}

export function PhotoField({ url, uploading, compact = false, onChoose, onRemove }: PhotoFieldProps) {
  const t = useTranslations('productRequest');

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Cleared so that choosing the same file again still fires a change event.
    event.target.value = '';
    if (file) onChoose(file);
  };

  const input = (
    <input hidden type="file" accept={ALLOWED_PHOTO_TYPES.join(',')} onChange={handleChange} />
  );

  if (uploading) {
    return <CircularProgress size={24} aria-label={t('fields.photo_url')} />;
  }

  if (url) {
    return (
      <Stack direction="row" alignItems="center" gap={compact ? 0 : 0.5}>
        <Box
          component="img"
          src={url}
          alt={t('fields.photo_url')}
          sx={{
            width: compact ? 32 : 96,
            height: compact ? 32 : 96,
            objectFit: 'cover',
            borderRadius: '8px',
          }}
        />
        <Tooltip title={t('removePhoto')}>
          <IconButton size="small" onClick={onRemove} aria-label={t('removePhoto')}>
            <RemoveIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    );
  }

  if (compact) {
    return (
      <Tooltip title={t('choosePhoto')}>
        <IconButton component="label" size="small" aria-label={t('choosePhoto')}>
          <PhotoIcon fontSize="small" />
          {input}
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Button component="label" variant="outlined" startIcon={<PhotoIcon />} sx={{ textTransform: 'none' }}>
      {t('choosePhoto')}
      {input}
    </Button>
  );
}
