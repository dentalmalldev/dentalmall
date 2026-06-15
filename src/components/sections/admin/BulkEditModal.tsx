'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close, CloudUpload, Delete } from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';
import { auth } from '@/lib/firebase';
import { Category } from '@/types/models';

type ApplyMode = 'replace' | 'fill_empty';

export interface BulkEditFieldsPayload {
  price?: number;
  sale_price?: number | null;
  manufacturer?: string;
  category_id?: string;
  vendor_id?: string | null;
  in_storage_stock?: boolean;
  stock?: { mode: 'set' | 'delta'; value: number };
  description?: { value: string; mode: ApplyMode };
  description_ka?: { value: string; mode: ApplyMode };
  image?: { url: string; filename: string; original_name: string; size?: number | null; mode: ApplyMode };
}

interface UploadedImage {
  url: string;
  filename: string;
  original_name: string;
  size?: number | null;
}

interface VendorOption {
  id: string;
  company_name: string;
}

// Module-level so it keeps a stable identity across renders — a component
// defined inside the modal body would remount on every keystroke and steal focus.
function BulkField({
  enabled,
  onToggle,
  label,
  children,
}: {
  enabled: boolean;
  onToggle: (v: boolean) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ opacity: enabled ? 1 : 0.55 }}>
      <FormControlLabel
        control={<Checkbox checked={enabled} onChange={(e) => onToggle(e.target.checked)} />}
        label={<Typography fontWeight={600}>{label}</Typography>}
      />
      <Box sx={{ pl: 4, pt: 0.5 }}>{children}</Box>
    </Box>
  );
}

interface BulkEditModalProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  vendors: VendorOption[];
  targetCount: number;
  submitting: boolean;
  onSubmit: (fields: BulkEditFieldsPayload) => void;
}

export function BulkEditModal({
  open,
  onClose,
  categories,
  vendors,
  targetCount,
  submitting,
  onSubmit,
}: BulkEditModalProps) {
  const t = useTranslations('admin');
  const locale = useLocale();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Per-field "update this field" toggles.
  const [en, setEn] = useState<Record<string, boolean>>({});
  const setField = (key: string, value: boolean) => setEn((p) => ({ ...p, [key]: value }));

  // Field values
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [inStorage, setInStorage] = useState(true);
  const [stockMode, setStockMode] = useState<'set' | 'delta'>('set');
  const [stockValue, setStockValue] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descEnMode, setDescEnMode] = useState<ApplyMode>('fill_empty');
  const [descKa, setDescKa] = useState('');
  const [descKaMode, setDescKaMode] = useState<ApplyMode>('fill_empty');
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [imageMode, setImageMode] = useState<ApplyMode>('fill_empty');

  const catName = (c: { name: string; name_ka: string }) => (locale === 'ka' ? c.name_ka : c.name);
  const subcategories = categories.find((c) => c.id === categoryId)?.children || [];

  const reset = () => {
    setStep('form');
    setError(null);
    setEn({});
    setPrice(''); setSalePrice(''); setManufacturer('');
    setCategoryId(''); setSubcategoryId(''); setVendorId('');
    setInStorage(true); setStockMode('set'); setStockValue('');
    setDescEn(''); setDescEnMode('fill_empty'); setDescKa(''); setDescKaMode('fill_empty');
    setImage(null); setImageMode('fill_empty');
  };

  const handleClose = () => {
    if (submitting || uploading) return;
    reset();
    onClose();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const fd = new FormData();
      fd.append('files', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }
      const [media] = await res.json();
      setImage({
        url: media.url,
        filename: media.filename,
        original_name: media.original_name,
        size: media.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Assemble the payload from enabled fields, validating each.
  const buildPayload = (): BulkEditFieldsPayload | null => {
    const f: BulkEditFieldsPayload = {};
    if (en.price) {
      const n = parseFloat(price);
      if (isNaN(n) || n < 0) return fail(t('bulkErrInvalidPrice'));
      f.price = n;
    }
    if (en.sale_price) {
      f.sale_price = salePrice === '' ? null : parseFloat(salePrice);
      if (f.sale_price !== null && (isNaN(f.sale_price) || f.sale_price < 0)) return fail(t('bulkErrInvalidPrice'));
    }
    if (en.manufacturer) f.manufacturer = manufacturer;
    if (en.category) {
      const finalCat = subcategoryId || categoryId;
      if (!finalCat) return fail(t('bulkErrNoCategory'));
      f.category_id = finalCat;
    }
    if (en.vendor) f.vendor_id = vendorId || null;
    if (en.in_storage_stock) f.in_storage_stock = inStorage;
    if (en.stock) {
      const n = parseInt(stockValue, 10);
      if (isNaN(n)) return fail(t('bulkErrInvalidStock'));
      f.stock = { mode: stockMode, value: n };
    }
    if (en.description) f.description = { value: descEn, mode: descEnMode };
    if (en.description_ka) f.description_ka = { value: descKa, mode: descKaMode };
    if (en.image) {
      if (!image) return fail(t('bulkErrNoImage'));
      f.image = { ...image, mode: imageMode };
    }
    if (Object.keys(f).length === 0) return fail(t('bulkErrNoFields'));
    return f;
  };

  const fail = (msg: string): null => {
    setError(msg);
    return null;
  };

  const payloadFieldLabels = (): string[] => {
    const labels: string[] = [];
    if (en.price) labels.push(t('price'));
    if (en.sale_price) labels.push(t('salePrice'));
    if (en.manufacturer) labels.push(t('manufacturer'));
    if (en.category) labels.push(t('category'));
    if (en.vendor) labels.push(t('vendor'));
    if (en.in_storage_stock) labels.push(t('inStorageStock'));
    if (en.stock) labels.push(t('stock'));
    if (en.description) labels.push(t('description'));
    if (en.description_ka) labels.push(t('descriptionKa'));
    if (en.image) labels.push(t('images'));
    return labels;
  };

  const handleReview = () => {
    const payload = buildPayload();
    if (payload) {
      setError(null);
      setStep('preview');
    }
  };

  const handleApply = () => {
    const payload = buildPayload();
    if (payload) onSubmit(payload);
  };

  const modeToggle = (value: ApplyMode, onChange: (v: ApplyMode) => void) => (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={value}
      onChange={(_, v) => v && onChange(v)}
      sx={{ mt: 1 }}
    >
      <ToggleButton value="fill_empty">{t('bulkFillEmpty')}</ToggleButton>
      <ToggleButton value="replace">{t('bulkReplace')}</ToggleButton>
    </ToggleButtonGroup>
  );

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" fullScreen={fullScreen}>
      <DialogTitle sx={{ pr: 6 }}>
        {step === 'form' ? t('bulkEditTitle') : t('bulkPreviewTitle')}
        <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8 }} disabled={submitting}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {step === 'form' ? (
          <Stack spacing={2.5} divider={<Divider flexItem />}>
            <Typography variant="body2" color="text.secondary">
              {t('bulkEditIntro', { count: targetCount })}
            </Typography>

            {/* Image */}
            <BulkField enabled={!!en.image} onToggle={(v) => setField('image', v)} label={t('images')}>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={uploading ? <CircularProgress size={16} /> : <CloudUpload />}
                  disabled={!en.image || uploading}
                >
                  {t('uploadImages')}
                  <input type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageUpload} />
                </Button>
                {image && (
                  <Box sx={{ position: 'relative', width: 64, height: 64 }}>
                    <Box component="img" src={image.url} alt="" sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 1 }} />
                    <IconButton size="small" onClick={() => setImage(null)} sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper' }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                )}
                {en.image && modeToggle(imageMode, setImageMode)}
              </Stack>
            </BulkField>

            {/* Price / Sale price */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box flex={1}>
                <BulkField enabled={!!en.price} onToggle={(v) => setField('price', v)} label={t('price')}>
                  <TextField fullWidth size="small" type="number" disabled={!en.price} value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start">₾</InputAdornment> }} />
                </BulkField>
              </Box>
              <Box flex={1}>
                <BulkField enabled={!!en.sale_price} onToggle={(v) => setField('sale_price', v)} label={t('salePrice')}>
                  <TextField fullWidth size="small" type="number" disabled={!en.sale_price} value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start">₾</InputAdornment> }} />
                </BulkField>
              </Box>
            </Stack>

            {/* Manufacturer */}
            <BulkField enabled={!!en.manufacturer} onToggle={(v) => setField('manufacturer', v)} label={t('manufacturer')}>
              <TextField fullWidth size="small" disabled={!en.manufacturer} value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
            </BulkField>

            {/* Category + Subcategory */}
            <BulkField enabled={!!en.category} onToggle={(v) => setField('category', v)} label={t('category')}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth size="small" disabled={!en.category}>
                  <InputLabel>{t('category')}</InputLabel>
                  <Select label={t('category')} value={categoryId}
                    onChange={(e) => { setCategoryId(e.target.value as string); setSubcategoryId(''); }}>
                    {categories.map((c) => <MenuItem key={c.id} value={c.id}>{catName(c)}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small" disabled={!en.category || !categoryId || subcategories.length === 0}>
                  <InputLabel>{t('subcategory')}</InputLabel>
                  <Select label={t('subcategory')} value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value as string)}>
                    <MenuItem value=""><em>{t('filterAllSubcategories')}</em></MenuItem>
                    {subcategories.map((c) => <MenuItem key={c.id} value={c.id}>{catName(c)}</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>
            </BulkField>

            {/* Vendor */}
            <BulkField enabled={!!en.vendor} onToggle={(v) => setField('vendor', v)} label={t('vendor')}>
              <FormControl fullWidth size="small" disabled={!en.vendor}>
                <InputLabel>{t('vendor')}</InputLabel>
                <Select label={t('vendor')} value={vendorId} onChange={(e) => setVendorId(e.target.value as string)}>
                  <MenuItem value=""><em>{t('noVendor')}</em></MenuItem>
                  {vendors.map((v) => <MenuItem key={v.id} value={v.id}>{v.company_name}</MenuItem>)}
                </Select>
              </FormControl>
            </BulkField>

            {/* In storage stock */}
            <BulkField enabled={!!en.in_storage_stock} onToggle={(v) => setField('in_storage_stock', v)} label={t('inStorageStock')}>
              <FormControlLabel
                control={<Switch checked={inStorage} disabled={!en.in_storage_stock} onChange={(e) => setInStorage(e.target.checked)} />}
                label={inStorage ? t('inStorageStock') : t('specialOrder')}
              />
            </BulkField>

            {/* Stock */}
            <BulkField enabled={!!en.stock} onToggle={(v) => setField('stock', v)} label={t('stock')}>
              <Stack direction="row" spacing={2} alignItems="center">
                <ToggleButtonGroup size="small" exclusive value={stockMode} disabled={!en.stock}
                  onChange={(_, v) => v && setStockMode(v)}>
                  <ToggleButton value="set">{t('bulkStockSet')}</ToggleButton>
                  <ToggleButton value="delta">{t('bulkStockDelta')}</ToggleButton>
                </ToggleButtonGroup>
                <TextField size="small" type="number" disabled={!en.stock} value={stockValue} onChange={(e) => setStockValue(e.target.value)} sx={{ width: 140 }} />
              </Stack>
            </BulkField>

            {/* Description EN */}
            <BulkField enabled={!!en.description} onToggle={(v) => setField('description', v)} label={t('description')}>
              <TextField fullWidth size="small" multiline rows={2} disabled={!en.description} value={descEn} onChange={(e) => setDescEn(e.target.value)} />
              {en.description && modeToggle(descEnMode, setDescEnMode)}
            </BulkField>

            {/* Description KA */}
            <BulkField enabled={!!en.description_ka} onToggle={(v) => setField('description_ka', v)} label={t('descriptionKa')}>
              <TextField fullWidth size="small" multiline rows={2} disabled={!en.description_ka} value={descKa} onChange={(e) => setDescKa(e.target.value)} />
              {en.description_ka && modeToggle(descKaMode, setDescKaMode)}
            </BulkField>
          </Stack>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('bulkPreviewHeading', { count: targetCount })}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('bulkPreviewFieldsLabel')}
            </Typography>
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {payloadFieldLabels().map((l) => (
                <Typography key={l}>• {l}</Typography>
              ))}
            </Stack>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {step === 'form' ? (
          <>
            <Button onClick={handleClose} disabled={submitting}>{t('cancel')}</Button>
            <Button variant="contained" onClick={handleReview}>{t('bulkReview')}</Button>
          </>
        ) : (
          <>
            <Button onClick={() => setStep('form')} disabled={submitting}>{t('bulkBack')}</Button>
            <Button variant="contained" onClick={handleApply} disabled={submitting}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}>
              {t('bulkApply')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
