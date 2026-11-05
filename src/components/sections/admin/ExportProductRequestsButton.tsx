'use client';

import { useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Stack, Typography } from '@mui/material';
import { Download } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { auth } from '@/lib/firebase';
import { exportProductRequestsToExcel } from '@/lib/admin/exportProductRequestsToExcel';
import { ProductRequestItem } from '@/types/models';

/** The list endpoint's ceiling. */
const PAGE_SIZE = 100;

interface ExportProductRequestsButtonProps {
  /** The active filters, so the export mirrors what's on screen. */
  filterParams: URLSearchParams;
}

export function ExportProductRequestsButton({ filterParams }: ExportProductRequestsButtonProps) {
  const t = useTranslations('admin');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = async (page: number, token: string | undefined) => {
    const params = new URLSearchParams(filterParams);
    params.set('limit', String(PAGE_SIZE));
    params.set('page', String(page));

    const res = await fetch(`/api/admin/product-requests?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(t('exportFailed'));
    return res.json() as Promise<{ data: ProductRequestItem[]; total_pages: number }>;
  };

  const handleExport = async () => {
    setRunning(true);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      const first = await fetchPage(1, token);
      const items = [...first.data];

      for (let page = 2; page <= first.total_pages; page++) {
        const next = await fetchPage(page, token);
        items.push(...next.data);
      }

      await exportProductRequestsToExcel(items, {
        sheetName: t('productRequestsNav'),
        name: t('productRequests.columns.name'),
        invoiceName: t('productRequests.columns.invoiceName'),
        description: t('productRequests.columns.description'),
        price: t('productRequests.columns.price'),
        store: t('productRequests.columns.store'),
        quantity: t('productRequests.columns.quantity'),
        photo: t('productRequests.columns.photo'),
        customer: t('productRequests.columns.customer'),
        email: t('productRequests.columns.email'),
        phone: t('productRequests.columns.phone'),
        date: t('productRequests.columns.date'),
        status: t('productRequests.columns.status'),
        note: t('productRequests.columns.note'),
        statusLabel: (item) => t(`productRequests.statuses.${item.status.toLowerCase()}`),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('exportFailed'));
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <Button variant="outlined" startIcon={<Download />} onClick={handleExport} disabled={running}>
        {t('exportExcel')}
      </Button>

      <Dialog open={running || error !== null} maxWidth="xs" fullWidth>
        <DialogTitle>{t('exportExcel')}</DialogTitle>
        <DialogContent>
          {error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {t('exportPreparing')}
              </Typography>
              <LinearProgress />
              <Typography variant="caption" color="text.secondary">
                {t('exportKeepOpen')}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        {error && (
          <DialogActions>
            <Button onClick={() => setError(null)}>{t('cancel')}</Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
}
