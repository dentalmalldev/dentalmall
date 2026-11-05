'use client';

import { Chip } from '@mui/material';
import { useTranslations } from 'next-intl';

/** Whether a user has a password, as Firebase reports it. `null` means Firebase couldn't tell us. */
export function PasswordStatusChip({ hasPassword }: { hasPassword: boolean | null }) {
  const t = useTranslations('admin');

  if (hasPassword === null) {
    return <Chip label={t('passwordStatusUnknown')} size="small" variant="outlined" />;
  }

  return (
    <Chip
      label={hasPassword ? t('hasPassword') : t('noPassword')}
      color={hasPassword ? 'success' : 'default'}
      size="small"
      variant="outlined"
    />
  );
}
