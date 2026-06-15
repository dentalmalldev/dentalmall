'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Slider,
  TextField,
  Stack,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  FormControl,
  RadioGroup,
  Radio,
  Switch,
  Link as MuiLink,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { ProductFacets } from '@/types';
import { ShopFilterValues } from './types';

interface ShopFiltersProps {
  values: ShopFilterValues;
  facets?: ProductFacets;
  onChange: (patch: Partial<ShopFilterValues>) => void;
}

// Searchable, "show more" checkbox list used for brand + vendor facets.
function FacetCheckboxList({
  options,
  selected,
  onToggle,
  searchPlaceholder,
}: {
  options: { key: string; label: string; count: number }[];
  selected: string[];
  onToggle: (key: string) => void;
  searchPlaceholder: string;
}) {
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const t = useTranslations('shop');

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;
  const visible = showAll ? filtered : filtered.slice(0, 8);

  return (
    <Box>
      {options.length > 8 && (
        <TextField
          size="small"
          fullWidth
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ mb: 1 }}
        />
      )}
      <Stack>
        {visible.map((o) => (
          <FormControlLabel
            key={o.key}
            control={
              <Checkbox
                size="small"
                checked={selected.includes(o.key)}
                onChange={() => onToggle(o.key)}
              />
            }
            label={
              <Typography variant="body2">
                {o.label}{' '}
                <Typography component="span" variant="caption" color="text.secondary">
                  ({o.count})
                </Typography>
              </Typography>
            }
          />
        ))}
        {visible.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            {t('noOptions')}
          </Typography>
        )}
      </Stack>
      {!showAll && filtered.length > 8 && (
        <MuiLink component="button" type="button" variant="body2" onClick={() => setShowAll(true)}>
          {t('showMore', { count: filtered.length - 8 })}
        </MuiLink>
      )}
    </Box>
  );
}

export function ShopFilters({ values, facets, onChange }: ShopFiltersProps) {
  const t = useTranslations('shop');

  const priceMin = facets?.priceMin ?? 0;
  const priceMax = facets?.priceMax ?? 0;
  const hasPriceRange = priceMax > priceMin;

  // Local slider value (committed to the URL on release).
  const [slider, setSlider] = useState<number[]>([
    values.minPrice ? Number(values.minPrice) : priceMin,
    values.maxPrice ? Number(values.maxPrice) : priceMax,
  ]);

  useEffect(() => {
    setSlider([
      values.minPrice ? Number(values.minPrice) : priceMin,
      values.maxPrice ? Number(values.maxPrice) : priceMax,
    ]);
  }, [values.minPrice, values.maxPrice, priceMin, priceMax]);

  const commitPrice = (range: number[]) => {
    onChange({
      minPrice: range[0] > priceMin ? String(range[0]) : '',
      maxPrice: range[1] < priceMax ? String(range[1]) : '',
    });
  };

  const toggleInArray = (arr: string[], key: string) =>
    arr.includes(key) ? arr.filter((x) => x !== key) : [...arr, key];

  const sectionSx = { '&:before': { display: 'none' }, boxShadow: 'none', borderTop: '1px solid', borderColor: 'divider' };

  return (
    <Box>
      {/* Price */}
      <Accordion defaultExpanded disableGutters sx={sectionSx}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography fontWeight={600}>{t('price')}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {hasPriceRange ? (
            <>
              <Slider
                value={slider}
                min={priceMin}
                max={priceMax}
                onChange={(_, v) => setSlider(v as number[])}
                onChangeCommitted={(_, v) => commitPrice(v as number[])}
                valueLabelDisplay="auto"
              />
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  type="number"
                  label={t('min')}
                  value={values.minPrice}
                  onChange={(e) => onChange({ minPrice: e.target.value })}
                  InputProps={{ startAdornment: <InputAdornment position="start">₾</InputAdornment> }}
                />
                <Typography color="text.secondary">–</Typography>
                <TextField
                  size="small"
                  type="number"
                  label={t('max')}
                  value={values.maxPrice}
                  onChange={(e) => onChange({ maxPrice: e.target.value })}
                  InputProps={{ startAdornment: <InputAdornment position="start">₾</InputAdornment> }}
                />
              </Stack>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t('noOptions')}
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Brand / Manufacturer */}
      {(facets?.manufacturers.length ?? 0) > 0 && (
        <Accordion defaultExpanded disableGutters sx={sectionSx}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography fontWeight={600}>{t('brand')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FacetCheckboxList
              options={(facets?.manufacturers || []).map((m) => ({ key: m.value, label: m.value, count: m.count }))}
              selected={values.brands}
              onToggle={(key) => onChange({ brands: toggleInArray(values.brands, key) })}
              searchPlaceholder={t('searchBrand')}
            />
          </AccordionDetails>
        </Accordion>
      )}

      {/* Vendor */}
      {(facets?.vendors.length ?? 0) > 0 && (
        <Accordion defaultExpanded disableGutters sx={sectionSx}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography fontWeight={600}>{t('vendor')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FacetCheckboxList
              options={(facets?.vendors || []).map((v) => ({ key: v.id, label: v.name, count: v.count }))}
              selected={values.vendors}
              onToggle={(key) => onChange({ vendors: toggleInArray(values.vendors, key) })}
              searchPlaceholder={t('searchVendor')}
            />
          </AccordionDetails>
        </Accordion>
      )}

      {/* Availability */}
      <Accordion defaultExpanded disableGutters sx={sectionSx}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography fontWeight={600}>{t('availability')}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormControl>
            <RadioGroup
              value={values.availability}
              onChange={(e) => onChange({ availability: e.target.value as ShopFilterValues['availability'] })}
            >
              <FormControlLabel value="all" control={<Radio size="small" />} label={t('availabilityAll')} />
              <FormControlLabel value="in_stock" control={<Radio size="small" />} label={t('availabilityInStock')} />
              <FormControlLabel value="preorder" control={<Radio size="small" />} label={t('availabilityPreorder')} />
            </RadioGroup>
          </FormControl>
        </AccordionDetails>
      </Accordion>

      {/* Toggles */}
      <Accordion defaultExpanded disableGutters sx={sectionSx}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography fontWeight={600}>{t('more')}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack>
            <FormControlLabel
              control={<Switch checked={values.onSale} onChange={(e) => onChange({ onSale: e.target.checked })} />}
              label={t('onSale')}
            />
            <FormControlLabel
              control={<Switch checked={values.hasVariants} onChange={(e) => onChange({ hasVariants: e.target.checked })} />}
              label={t('hasVariants')}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
