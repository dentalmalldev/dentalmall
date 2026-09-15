'use client';

import { useEffect, useState, Fragment } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
} from '@mui/material';
import { Close, CloudUpload, Download, ArrowBack, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { auth } from '@/lib/firebase';
import * as XLSX from 'xlsx';
import type { PreviewResponse, PreviewRow } from '@/app/api/admin/products/bulk-upload/route';
import type { CommitResponse } from '@/app/api/admin/products/bulk-upload/commit/route';
import type { BulkProductRow } from '@/lib/validations/bulkProductUpload';

interface BulkUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'upload' | 'preview' | 'result';

export function BulkUploadModal({ open, onClose, onSuccess }: BulkUploadModalProps) {
  const t = useTranslations('admin');
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [skipInvalid, setSkipInvalid] = useState(true);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [result, setResult] = useState<CommitResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState<string>('');
  const [vendors, setVendors] = useState<Array<{ id: string; company_name: string }>>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/admin/vendors?active=true', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setVendors(data);
      } catch {
        // Vendor list is optional — failures shouldn't block the modal
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const reset = () => {
    setStep('upload');
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setSkipInvalid(true);
    setVendorId('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const formData = new FormData();
      formData.append('file', file);
      if (vendorId) formData.append('vendor_id', vendorId);
      const res = await fetch('/api/admin/products/bulk-upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to parse file');
      }
      const data = (await res.json()) as PreviewResponse;
      setPreview(data);
      setStep('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!preview) return;
    setLoading(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const rowsToCommit: BulkProductRow[] = preview.rows
        .filter((r) => r.isValid)
        .map((r) => ({
          rowNumber: r.rowNumber,
          status: r.status === 'error' ? 'new' : r.status,
          existing_product_id: r.existing_product_id,
          name_en: r.raw.name_en,
          name_ka: r.raw.name_ka,
          description_en: r.raw.description_en,
          description_ka: r.raw.description_ka,
          manufacturer: r.raw.manufacturer,
          sku: r.raw.sku,
          price: r.raw.price,
          dentalmall_price: r.raw.dentalmall_price,
          unit: r.raw.unit,
          quantity: r.raw.quantity ?? 0,
          in_storage_stock: r.raw.in_storage_stock,
          category_id: r.resolved.category_id!,
          subcategory_id: r.resolved.subcategory_id,
          vendor_id: r.resolved.vendor_id,
          variant_type_en: r.raw.variant_type_en,
          variant_type_ka: r.raw.variant_type_ka,
          variant_options: r.raw.variant_options.map((o) => ({
            name_en: o.name_en,
            name_ka: o.name_ka,
            price: o.price ?? 0,
            dentalmall_price: o.dentalmall_price,
            sku: o.sku,
            quantity: o.quantity,
          })),
        }));

      if (rowsToCommit.length === 0) {
        throw new Error('No valid rows to import');
      }

      const res = await fetch('/api/admin/products/bulk-upload/commit', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rows: rowsToCommit,
          mode: skipInvalid ? 'skip-invalid' : 'abort-on-error',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Commit failed');
      }
      const data = (await res.json()) as CommitResponse;
      setResult(data);
      setStep('result');
      if (data.summary.created > 0) onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Commit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Served as a static asset — drop the canonical .xlsx at this path on the server.
    window.location.href = '/templates/product-upload-template.xlsx';
  };

  const handleDownloadErrorReport = () => {
    if (!preview) return;
    const invalidRows = preview.rows.filter((r) => !r.isValid);
    if (invalidRows.length === 0) return;

    const reportData = invalidRows.map((r) => ({
      Row: r.rowNumber,
      Status: r.status,
      'Product Name (EN)': r.raw.name_en,
      'Product Name (KA)': r.raw.name_ka,
      Category: r.raw.category ?? '',
      Vendor: r.raw.vendor ?? '',
      SKU: r.raw.sku ?? '',
      Errors: r.errors.map((e) => `${e.field}: ${e.message}`).join(' | '),
    }));
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Errors');
    XLSX.writeFile(wb, `bulk-upload-errors-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          {step !== 'upload' && step !== 'result' && (
            <IconButton size="small" onClick={() => setStep('upload')}>
              <ArrowBack />
            </IconButton>
          )}
          <Typography variant="h6" fontWeight={700}>
            {step === 'upload' && t('bulkUploadTitle')}
            {step === 'preview' && t('bulkUploadPreviewTitle')}
            {step === 'result' && t('bulkUploadResultTitle')}
          </Typography>
        </Stack>
        <IconButton onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {step === 'upload' && (
          <Stack spacing={3}>
            <Alert severity="info">{t('bulkUploadInstructions')}</Alert>

            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleDownloadTemplate}
              >
                {t('bulkUploadDownloadTemplate')}
              </Button>
            </Stack>

            <FormControl fullWidth size="small">
              <InputLabel id="bulk-upload-vendor-label">
                {t('bulkUploadVendorLabel')}
              </InputLabel>
              <Select
                labelId="bulk-upload-vendor-label"
                value={vendorId}
                label={t('bulkUploadVendorLabel')}
                onChange={(e) => setVendorId(e.target.value)}
              >
                <MenuItem value="">
                  <em>{t('bulkUploadVendorNone')}</em>
                </MenuItem>
                {vendors.map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    {v.company_name}
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.5 }}>
                {t('bulkUploadVendorHint')}
              </Typography>
            </FormControl>

            <Box
              component="label"
              sx={{
                border: '2px dashed',
                borderColor: file ? 'primary.main' : 'divider',
                borderRadius: '12px',
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="body1" fontWeight={600}>
                {file ? file.name : t('bulkUploadPickFile')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('bulkUploadFileHint')}
              </Typography>
              <input
                type="file"
                accept=".xlsx,.xls"
                hidden
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={skipInvalid}
                  onChange={(e) => setSkipInvalid(e.target.checked)}
                />
              }
              label={t('bulkUploadSkipInvalid')}
            />
          </Stack>
        )}

        {step === 'preview' && preview && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap alignItems="center">
              <Chip label={`🆕 ${t('bulkStatusNew')}: ${preview.summary.new}`} color="info" />
              <Chip label={`🔄 ${t('bulkStatusUpdate')}: ${preview.summary.update}`} color="warning" />
              <Chip label={`✓ ${t('bulkStatusUnchanged')}: ${preview.summary.unchanged}`} color="default" />
              <Chip
                label={`❌ ${t('bulkStatusError')}: ${preview.summary.error}`}
                color={preview.summary.error > 0 ? 'error' : 'default'}
              />
              {preview.summary.invalid > 0 && (
                <Button
                  size="small"
                  startIcon={<Download />}
                  onClick={handleDownloadErrorReport}
                >
                  {t('bulkUploadDownloadErrors')}
                </Button>
              )}
            </Stack>

            {preview.fileErrors.length > 0 && (
              <Alert severity="warning">
                {preview.fileErrors.map((e, i) => (
                  <div key={i}>{e}</div>
                ))}
              </Alert>
            )}

            <PreviewTable rows={preview.rows} />
          </Stack>
        )}

        {step === 'result' && result && (
          <Stack spacing={3}>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <Chip label={`${t('bulkUploadCreated')}: ${result.summary.created}`} color="success" />
              <Chip label={`${t('bulkStatusUpdate')}: ${result.summary.updated}`} color="warning" />
              <Chip label={`${t('bulkStatusUnchanged')}: ${result.summary.unchanged}`} color="default" />
              <Chip
                label={`${t('bulkUploadFailed')}: ${result.summary.failed}`}
                color={result.summary.failed > 0 ? 'error' : 'default'}
              />
            </Stack>

            {result.results.some((r) => r.status === 'failed') && (
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('bulkUploadRow')}</TableCell>
                      <TableCell>{t('bulkUploadStatus')}</TableCell>
                      <TableCell>{t('bulkUploadError')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.results
                      .filter((r) => r.status === 'failed')
                      .map((r) => (
                        <TableRow key={r.rowNumber}>
                          <TableCell>{r.rowNumber}</TableCell>
                          <TableCell>
                            <Chip label={r.status} size="small" color="error" />
                          </TableCell>
                          <TableCell>{r.error}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        {step === 'upload' && (
          <>
            <Button onClick={handleClose}>{t('cancel')}</Button>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!file || loading}
              startIcon={loading ? <CircularProgress size={16} /> : <CloudUpload />}
            >
              {t('bulkUploadParse')}
            </Button>
          </>
        )}
        {step === 'preview' && preview && (
          <>
            <Button onClick={() => setStep('upload')}>{t('bulkUploadBack')}</Button>
            <Button
              variant="contained"
              onClick={handleCommit}
              disabled={loading || preview.summary.new + preview.summary.update === 0}
              startIcon={loading ? <CircularProgress size={16} /> : undefined}
            >
              {t('bulkUploadCommit', { count: preview.summary.new + preview.summary.update })}
            </Button>
          </>
        )}
        {step === 'result' && (
          <Button variant="contained" onClick={handleClose}>
            {t('bulkUploadDone')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

const STATUS_META: Record<
  PreviewRow['status'],
  { key: string; color: 'info' | 'warning' | 'default' | 'error'; icon: string }
> = {
  new: { key: 'bulkStatusNew', color: 'info', icon: '🆕' },
  update: { key: 'bulkStatusUpdate', color: 'warning', icon: '🔄' },
  unchanged: { key: 'bulkStatusUnchanged', color: 'default', icon: '✓' },
  error: { key: 'bulkStatusError', color: 'error', icon: '❌' },
};

// Diff field keys → existing admin translation keys.
const DIFF_FIELD_KEYS: Record<string, string> = {
  name: 'productName',
  name_ka: 'productNameKa',
  description: 'description',
  description_ka: 'descriptionKa',
  manufacturer: 'manufacturer',
  price: 'price',
  dentalmall_price: 'dentalmallPrice',
  unit: 'unit',
  stock: 'stock',
  in_storage_stock: 'inStorageStock',
  category: 'category',
  vendor: 'vendor',
  variants: 'variants',
};

/**
 * Every parsed product field, labelled with the template column it came from,
 * so an admin can hold the preview next to the spreadsheet and check them
 * one-for-one. Order follows the sheet left to right.
 */
const PARSED_PRODUCT_FIELDS: { key: keyof PreviewRow['raw']; column: string }[] = [
  { key: 'name_en', column: 'A · პროდუქტის სახელი' },
  { key: 'name_ka', column: 'B · სახელი (ქართულად)' },
  { key: 'description_en', column: 'C · პროდუქციის აღწერა' },
  { key: 'description_ka', column: 'D · აღწერა (ქართულად)' },
  { key: 'manufacturer', column: 'E · მწარმოებელი' },
  { key: 'sku', column: 'F · SKU' },
  { key: 'price', column: 'G · ფასი (გასაყიდი)' },
  { key: 'dentalmall_price', column: 'H · დენტალმოლის ფასი (თვითღირებულება)' },
  { key: 'unit', column: 'I · ერთეული' },
  { key: 'quantity', column: 'J · მოწოდებული რაოდენობა' },
  { key: 'in_storage_stock', column: '(J-დან) in_storage_stock' },
  { key: 'category', column: 'K · კატეგორია' },
  { key: 'subcategory', column: 'L · ქვეკატეგორია' },
  { key: 'vendor', column: 'მომწოდებელი' },
  { key: 'variant_type_en', column: 'N · ვარიანტის სახელი' },
  { key: 'variant_type_ka', column: 'O · ვარიანტის სახელი (ქართ.)' },
];

/** Same idea for the six columns of each option slot. */
const PARSED_OPTION_FIELDS: { key: keyof PreviewRow['raw']['variant_options'][number]; column: string }[] = [
  { key: 'name_en', column: 'სახელი (EN)' },
  { key: 'name_ka', column: 'სახელი (ქართ.)' },
  { key: 'price', column: 'მაღაზიის ფასი → price' },
  { key: 'dentalmall_price', column: 'DentalMall ფასი → dentalmall_price' },
  { key: 'sku', column: 'SKU' },
  { key: 'quantity', column: 'რაოდენობა' },
];

/** Render a parsed value so "empty" and "false" are visibly different from real text. */
function ParsedValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === '') {
    return <Typography component="span" variant="body2" color="text.disabled">—</Typography>;
  }
  if (typeof value === 'boolean') {
    return <Chip size="small" label={value ? 'true' : 'false'} color={value ? 'success' : 'default'} />;
  }
  return (
    <Typography component="span" variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {String(value)}
    </Typography>
  );
}

function ParsedRowDetails({ row }: { row: PreviewRow }) {
  const t = useTranslations('admin');
  return (
    <Stack spacing={2} sx={{ py: 1.5, pl: 2, pr: 1 }}>
      <Box>
        <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.5}>
          {t('bulkUploadParsedFields')}
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            columnGap: 3,
            rowGap: 0.5,
          }}
        >
          {PARSED_PRODUCT_FIELDS.map(({ key, column }) => (
            <Box key={key} sx={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 1, alignItems: 'baseline' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                {key}
                <Typography component="span" variant="caption" color="text.disabled" display="block">
                  {column}
                </Typography>
              </Typography>
              <ParsedValue value={row.raw[key]} />
            </Box>
          ))}
        </Box>
      </Box>

      {row.raw.variant_options.length > 0 && (
        <Box>
          <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.5}>
            {t('bulkUploadParsedOptions')}
          </Typography>
          <Table size="small" sx={{ '& td, & th': { py: 0.5 } }}>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                {PARSED_OPTION_FIELDS.map((f) => (
                  <TableCell key={f.key}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }} display="block">{f.key}</Typography>
                    <Typography variant="caption" color="text.disabled">{f.column}</Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {row.raw.variant_options.map((o, i) => (
                <TableRow key={i}>
                  <TableCell>{i + 1}</TableCell>
                  {PARSED_OPTION_FIELDS.map((f) => (
                    <TableCell key={f.key}><ParsedValue value={o[f.key]} /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Stack>
  );
}

function PreviewTable({ rows }: { rows: PreviewRow[] }) {
  const t = useTranslations('admin');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (rowNumber: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });

  const fieldLabel = (field: string) => {
    const key = DIFF_FIELD_KEYS[field];
    return key ? t(key) : field;
  };

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 480 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>{t('bulkUploadRow')}</TableCell>
            <TableCell>{t('bulkUploadStatus')}</TableCell>
            <TableCell>{t('bulkUploadProductName')}</TableCell>
            <TableCell>{t('category')}</TableCell>
            <TableCell>{t('bulkUploadVariantCount')}</TableCell>
            <TableCell>{t('bulkUploadIssues')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => {
            const meta = STATUS_META[r.status];
            const isUpdate = r.status === 'update';
            const isOpen = expanded.has(r.rowNumber);
            return (
              <Fragment key={r.rowNumber}>
                <TableRow
                  hover
                  sx={{ cursor: 'pointer', '& > *': { borderBottom: isOpen ? 'unset' : undefined } }}
                  onClick={() => toggle(r.rowNumber)}
                >
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      {isOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                      <span>{r.rowNumber}</span>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Chip label={`${meta.icon} ${t(meta.key)}`} size="small" color={meta.color} />
                      {isUpdate && (
                        <Typography variant="caption" color="text.secondary">
                          {t('bulkFieldsWillChange', { count: r.diff.length })}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Typography variant="body2" noWrap>
                      {r.raw.name_en || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>{r.raw.category || '—'}</TableCell>
                  <TableCell>{r.raw.variant_options.length}</TableCell>
                  <TableCell sx={{ maxWidth: 320 }}>
                    {[...r.errors, ...r.warnings].map((e, idx) => (
                      <Typography
                        key={idx}
                        variant="caption"
                        display="block"
                        color={r.errors.includes(e) ? 'error.main' : 'warning.main'}
                      >
                        {e.message}
                      </Typography>
                    ))}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 0, border: 0, bgcolor: 'grey.50' }}>
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                      {isUpdate && (
                        <Box sx={{ pt: 1.5, pl: 2 }}>
                          <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.5}>
                            {t('bulkUploadChanges')}
                          </Typography>
                          {r.diff.map((d) => (
                            <Typography key={d.field} variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {fieldLabel(d.field)}: {d.from} → {d.to}
                            </Typography>
                          ))}
                        </Box>
                      )}
                      <ParsedRowDetails row={r} />
                    </Collapse>
                  </TableCell>
                </TableRow>
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
