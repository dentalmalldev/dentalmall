'use client';

import { Stack, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import { amountToPay, toTetri } from '@/lib/credit/money';

interface OrderCreditRowsProps {
  total: string | number;
  creditApplied: string | number | null | undefined;
  /** Text size of the surrounding totals block. */
  size?: 'body1' | 'body2';
}

/**
 * The store-credit line and the amount to pay, placed under an order's total.
 * Renders nothing for an order that used no credit.
 */
export function OrderCreditRows({ total, creditApplied, size = 'body1' }: OrderCreditRowsProps) {
  const t = useTranslations('credit');
  if (creditApplied == null || toTetri(creditApplied) <= 0) return null;

  const credit = toTetri(creditApplied) / 100;
  const toPay = amountToPay(total, creditApplied);

  return (
    <>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant={size} color="success.main">
          {t('line')}
        </Typography>
        <Typography variant={size} color="success.main">
          -₾{credit.toFixed(2)}
        </Typography>
      </Stack>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant={size} fontWeight={700}>
          {t('amountToPay')}
        </Typography>
        <Typography variant={size} fontWeight={700} color="primary.main">
          ₾{toPay.toFixed(2)}
        </Typography>
      </Stack>
    </>
  );
}
