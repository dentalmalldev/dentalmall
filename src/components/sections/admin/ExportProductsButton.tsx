'use client';

import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Typography,
  Stack,
  Alert,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { auth } from '@/lib/firebase';
import { Category, Product } from '@/types/models';
import { exportProductsToExcel } from '@/lib/admin/exportProductsToExcel';

/** The list endpoint's ceiling (adminProductFilterSchema caps `limit` at 100). */
const PAGE_SIZE = 100;
/** Pages fetched at once. Enough to be quick without hammering the database. */
const CONCURRENCY = 4;

interface ExportProductsButtonProps {
  /** The active filter query string — the export mirrors exactly what's on screen. */
  filterQueryString: string;
  categories: Category[];
}

interface ProductsPage {
  data: Product[];
  total: number;
  total_pages: number;
}

export function ExportProductsButton({
  filterQueryString,
  categories,
}: ExportProductsButtonProps) {
  const t = useTranslations('admin');
  const [running, setRunning] = useState(false);
  const [fetched, setFetched] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = async (page: number, token: string | undefined): Promise<ProductsPage> => {
    const params = new URLSearchParams(filterQueryString);
    params.delete('pageSize');
    params.set('limit', String(PAGE_SIZE));
    params.set('page', String(page));

    const res = await fetch(`/api/admin/products?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(t('exportFailed'));
    return res.json();
  };

  const handleExport = async () => {
    setRunning(true);
    setError(null);
    setFetched(0);
    setTotal(0);

    try {
      const token = await auth.currentUser?.getIdToken();

      // The first page doubles as the count query — it tells us how many more
      // there are, so the rest can be pulled in parallel batches.
      const first = await fetchPage(1, token);
      const products: Product[] = [...first.data];
      setTotal(first.total);
      setFetched(products.length);

      const remaining = Array.from(
        { length: Math.max(0, first.total_pages - 1) },
        (_, i) => i + 2
      );

      // Batched rather than all-at-once: a 5,000-product catalogue would
      // otherwise open 50 simultaneous connections.
      for (let i = 0; i < remaining.length; i += CONCURRENCY) {
        const batch = remaining.slice(i, i + CONCURRENCY);
        const pages = await Promise.all(batch.map((page) => fetchPage(page, token)));
        pages.forEach((p) => products.push(...p.data));
        setFetched(products.length);
      }

      await exportProductsToExcel(products, categories);
      setRunning(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('exportFailed'));
      setRunning(false);
    }
  };

  const progress = total > 0 ? Math.round((fetched / total) * 100) : 0;

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
                {total > 0
                  ? t('exportProgress', { fetched, total })
                  : t('exportPreparing')}
              </Typography>
              <LinearProgress
                variant={total > 0 ? 'determinate' : 'indeterminate'}
                value={progress}
              />
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
