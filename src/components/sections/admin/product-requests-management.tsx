'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link as MuiLink,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { EditNote as NoteIcon } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { PaginationControl } from '@/components/common';
import {
  MAX_ADMIN_NOTE_LENGTH,
  PRODUCT_REQUEST_STATUSES,
  PRODUCT_REQUEST_TRANSITIONS,
} from '@/lib/validations/product-request';
import { useAuth } from '@/providers';
import { ProductRequestItem, ProductRequestStatus } from '@/types/models';
import { ExportProductRequestsButton } from './ExportProductRequestsButton';

const STATUS_COLORS: Record<ProductRequestStatus, 'info' | 'warning' | 'success' | 'error'> = {
  NEW: 'info',
  IN_PROGRESS: 'warning',
  DONE: 'success',
  REJECTED: 'error',
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('ka-GE', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });

export function ProductRequestsManagement() {
  const t = useTranslations('admin');
  const { user } = useAuth();

  const [items, setItems] = useState<ProductRequestItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [noteItem, setNoteItem] = useState<ProductRequestItem | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filterParams = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
    if (status) params.set('status', status);
    // Whole days in the admin's own timezone, sent as exact moments.
    if (dateFrom) params.set('date_from', new Date(`${dateFrom}T00:00:00`).toISOString());
    if (dateTo) params.set('date_to', new Date(`${dateTo}T23:59:59.999`).toISOString());
    return params;
  }, [debouncedSearch, status, dateFrom, dateTo]);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams(filterParams);
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      const res = await fetch(`/api/admin/product-requests?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setItems(json.data);
        setTotal(json.total);
      } else {
        setError(t('productRequests.loadFailed'));
      }
    } catch (err) {
      console.error('Error fetching product requests:', err);
      setError(t('productRequests.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [user, filterParams, page, pageSize, t]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const updateItem = async (id: string, body: { status?: ProductRequestStatus; admin_note?: string }) => {
    if (!user) return;
    setActing(id);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/product-requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(res.status === 409 ? t('productRequests.statusConflict') : t('productRequests.updateFailed'));
      }
      await fetchItems();
    } catch {
      setError(t('productRequests.updateFailed'));
    } finally {
      setActing(null);
    }
  };

  const handleNoteSave = async () => {
    if (!noteItem) return;
    const item = noteItem;
    setNoteItem(null);
    await updateItem(item.id, { admin_note: noteText.trim() });
  };

  const statusLabel = (value: ProductRequestStatus) => t(`productRequests.statuses.${value.toLowerCase()}`);

  const filterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          {t('productRequestsNav')}
        </Typography>
        <Box>
          <ExportProductRequestsButton filterParams={filterParams} />
        </Box>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} gap={2} sx={{ mb: 3 }}>
        <TextField
          size="small"
          label={t('productRequests.searchUser')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: { md: '2 1 260px' } }}
        />
        <TextField
          select
          size="small"
          label={t('productRequests.columns.status')}
          value={status}
          onChange={(e) => filterChange(setStatus)(e.target.value)}
          sx={{ flex: { md: '1 1 160px' } }}
        >
          <MenuItem value="">{t('productRequests.allStatuses')}</MenuItem>
          {PRODUCT_REQUEST_STATUSES.map((value) => (
            <MenuItem key={value} value={value}>{statusLabel(value)}</MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          type="date"
          label={t('productRequests.dateFrom')}
          value={dateFrom}
          onChange={(e) => filterChange(setDateFrom)(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ flex: { md: '1 1 150px' } }}
        />
        <TextField
          size="small"
          type="date"
          label={t('productRequests.dateTo')}
          value={dateTo}
          onChange={(e) => filterChange(setDateTo)(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ flex: { md: '1 1 150px' } }}
        />
      </Stack>

      {loading && items.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: '16px', textAlign: 'center' }}>
          <Typography color="text.secondary">{t('productRequests.empty')}</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
          {/* Columns share the width on desktop. The sidebar leaves too little room below lg, so those screens scroll. */}
          <Table
            size="small"
            sx={{
              tableLayout: { lg: 'fixed' },
              minWidth: { xs: 900, lg: 0 },
              '& th, & td': { px: 1, overflowWrap: 'break-word' },
              '& th': { fontSize: '12px' },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '6%' }}>{t('productRequests.columns.photo')}</TableCell>
                <TableCell sx={{ width: '14%' }}>{t('productRequests.columns.name')}</TableCell>
                <TableCell sx={{ width: '14%' }}>{t('productRequests.columns.description')}</TableCell>
                <TableCell sx={{ width: '8%' }}>{t('productRequests.columns.price')}</TableCell>
                <TableCell sx={{ width: '8%' }}>{t('productRequests.columns.store')}</TableCell>
                <TableCell sx={{ width: '7%' }}>{t('productRequests.columns.quantity')}</TableCell>
                <TableCell sx={{ width: '15%' }}>{t('productRequests.columns.customer')}</TableCell>
                <TableCell sx={{ width: '8%' }}>{t('productRequests.columns.date')}</TableCell>
                <TableCell sx={{ width: '12%' }}>{t('productRequests.columns.status')}</TableCell>
                <TableCell sx={{ width: '8%' }}>{t('productRequests.columns.note')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => {
                const customer = item.request.user;
                const nextStatuses = PRODUCT_REQUEST_TRANSITIONS[item.status];
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.photo_url ? (
                        <MuiLink href={item.photo_url} target="_blank" rel="noopener noreferrer">
                          <Avatar variant="rounded" src={item.photo_url} alt={item.name} sx={{ width: 36, height: 36 }} />
                        </MuiLink>
                      ) : (
                        <Typography color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.name}
                      {item.invoice_name && (
                        <Typography variant="caption" color="text.secondary" component="div">
                          {t('productRequests.columns.invoiceName')}: {item.invoice_name}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'pre-wrap' }}>{item.description}</TableCell>
                    <TableCell>{item.estimated_price}</TableCell>
                    <TableCell>{item.store}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {customer.first_name} {customer.last_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" component="div">
                        {customer.email}
                      </Typography>
                      {customer.phone_number && (
                        <MuiLink href={`tel:${customer.phone_number.replace(/[^\d+]/g, '')}`} variant="body2">
                          {customer.phone_number}
                        </MuiLink>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(item.created_at)}</TableCell>
                    <TableCell>
                      {nextStatuses.length > 0 ? (
                        <TextField
                          select
                          size="small"
                          fullWidth
                          value={item.status}
                          disabled={acting === item.id}
                          onChange={(e) =>
                            updateItem(item.id, { status: e.target.value as ProductRequestStatus })
                          }
                        >
                          {[item.status, ...nextStatuses].map((value) => (
                            <MenuItem key={value} value={value}>{statusLabel(value)}</MenuItem>
                          ))}
                        </TextField>
                      ) : (
                        <Chip label={statusLabel(item.status)} color={STATUS_COLORS[item.status]} size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" gap={0.5}>
                        <Typography variant="body2" sx={{ flex: 1, minWidth: 0, whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
                          {item.admin_note}
                        </Typography>
                        <Tooltip title={t('productRequests.editNote')}>
                          <IconButton
                            size="small"
                            aria-label={t('productRequests.editNote')}
                            onClick={() => {
                              setNoteItem(item);
                              setNoteText(item.admin_note ?? '');
                            }}
                          >
                            <NoteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ mt: 2 }}>
        <PaginationControl
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          pageSizeOptions={[25, 50, 100]}
          countVariant="total"
        />
      </Box>

      <Dialog open={!!noteItem} onClose={() => setNoteItem(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('productRequests.editNote')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={4}
            sx={{ mt: 1 }}
            label={t('productRequests.columns.note')}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            slotProps={{ htmlInput: { maxLength: MAX_ADMIN_NOTE_LENGTH } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteItem(null)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={handleNoteSave}>
            {t('save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
