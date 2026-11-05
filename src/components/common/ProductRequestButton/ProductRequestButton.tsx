'use client';

import { Button, ButtonProps } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useProductRequestEntry } from '@/hooks/useProductRequestEntry';
import { colors } from '@/theme';

export function ProductRequestButton({ sx, ...props }: Omit<ButtonProps, 'onClick'>) {
  const t = useTranslations('productRequest');
  const { openRequestPage } = useProductRequestEntry();

  return (
    <Button
      variant="contained"
      onClick={openRequestPage}
      {...props}
      sx={[
        {
          borderRadius: '100px',
          textTransform: 'none',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          backgroundColor: colors.accent.main,
          '&:hover': { backgroundColor: colors.accent.hover },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {t('cta')}
    </Button>
  );
}
