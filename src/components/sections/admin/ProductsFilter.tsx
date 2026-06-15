'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  TextField,
  Autocomplete,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  Typography,
  InputAdornment,
  Collapse,
  IconButton,
} from '@mui/material';
import { FilterList, Close, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';
import { Category } from '@/types/models';

export interface ProductFilterValues {
  search: string;
  vendorIds: string[];
  categoryId: string;
  subcategoryId: string;
  minPrice: string;
  maxPrice: string;
}

interface VendorOption {
  id: string;
  company_name: string;
}

interface ProductsFilterProps {
  categories: Category[];
  vendors: VendorOption[];
  values: ProductFilterValues;
  activeCount: number;
  onChange: (patch: Partial<ProductFilterValues>) => void;
  onClear: () => void;
}

export function ProductsFilter({
  categories,
  vendors,
  values,
  activeCount,
  onChange,
  onClear,
}: ProductsFilterProps) {
  const t = useTranslations('admin');
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  // Local, debounced mirror of the item-name input (~300ms) to avoid a request per keystroke.
  const [searchInput, setSearchInput] = useState(values.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the local input in sync when the URL/value changes externally (e.g. Clear all).
  useEffect(() => {
    setSearchInput(values.search);
  }, [values.search]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange({ search: value }), 300);
  };

  const catName = (c: { name: string; name_ka: string }) => (locale === 'ka' ? c.name_ka : c.name);

  const selectedCategory = categories.find((c) => c.id === values.categoryId);
  const subcategories = selectedCategory?.children || [];
  const selectedVendors = vendors.filter((v) => values.vendorIds.includes(v.id));

  const panel = (
    <Grid container spacing={2}>
      {/* Item name */}
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          fullWidth
          size="small"
          label={t('filterItemName')}
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </Grid>

      {/* Vendor multi-select */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Autocomplete
          multiple
          size="small"
          options={vendors}
          value={selectedVendors}
          getOptionLabel={(o) => o.company_name}
          isOptionEqualToValue={(o, v) => o.id === v.id}
          onChange={(_, selected) => onChange({ vendorIds: selected.map((v) => v.id) })}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => {
              const { key, ...rest } = getTagProps({ index });
              return <Chip key={key} {...rest} label={option.company_name} size="small" />;
            })
          }
          renderInput={(params) => <TextField {...params} label={t('filterVendor')} />}
        />
      </Grid>

      {/* Category */}
      <Grid size={{ xs: 12, md: 6 }}>
        <FormControl fullWidth size="small">
          <InputLabel>{t('category')}</InputLabel>
          <Select
            label={t('category')}
            value={values.categoryId}
            onChange={(e) =>
              // Changing the category resets any chosen subcategory.
              onChange({ categoryId: e.target.value as string, subcategoryId: '' })
            }
          >
            <MenuItem value="">
              <em>{t('filterAllCategories')}</em>
            </MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {catName(c)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Subcategory (dependent on category) */}
      <Grid size={{ xs: 12, md: 6 }}>
        <FormControl fullWidth size="small" disabled={!values.categoryId || subcategories.length === 0}>
          <InputLabel>{t('subcategory')}</InputLabel>
          <Select
            label={t('subcategory')}
            value={values.subcategoryId}
            onChange={(e) => onChange({ subcategoryId: e.target.value as string })}
          >
            <MenuItem value="">
              <em>{t('filterAllSubcategories')}</em>
            </MenuItem>
            {subcategories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {catName(c)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Price range */}
      <Grid size={{ xs: 6, md: 3 }}>
        <TextField
          fullWidth
          size="small"
          type="number"
          label={t('filterMinPrice')}
          value={values.minPrice}
          onChange={(e) => onChange({ minPrice: e.target.value })}
          InputProps={{ startAdornment: <InputAdornment position="start">₾</InputAdornment> }}
          inputProps={{ min: 0 }}
        />
      </Grid>
      <Grid size={{ xs: 6, md: 3 }}>
        <TextField
          fullWidth
          size="small"
          type="number"
          label={t('filterMaxPrice')}
          value={values.maxPrice}
          onChange={(e) => onChange({ maxPrice: e.target.value })}
          InputProps={{ startAdornment: <InputAdornment position="start">₾</InputAdornment> }}
          inputProps={{ min: 0 }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center" sx={{ height: '100%' }}>
          {activeCount > 0 && (
            <Button startIcon={<Close />} color="inherit" onClick={onClear}>
              {t('filterClearAll')}
            </Button>
          )}
        </Stack>
      </Grid>
    </Grid>
  );

  return (
    <Paper sx={{ p: { xs: 2, md: 2.5 }, mb: 3, borderRadius: '12px' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={1}>
          <FilterList color="action" />
          <Typography variant="subtitle1" fontWeight={600}>
            {t('filters')}
          </Typography>
          {activeCount > 0 && (
            <Chip
              size="small"
              color="primary"
              label={t('filtersActive', { count: activeCount })}
            />
          )}
        </Stack>
        {/* Collapse toggle — primarily for mobile */}
        <IconButton
          size="small"
          onClick={() => setOpen((o) => !o)}
          sx={{ display: { xs: 'inline-flex', md: 'none' } }}
        >
          {open ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Stack>

      {/* Always expanded on desktop; collapsible on mobile */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, mt: 2 }}>{panel}</Box>
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Collapse in={open}>
          <Box sx={{ mt: 2 }}>{panel}</Box>
        </Collapse>
      </Box>
    </Paper>
  );
}
