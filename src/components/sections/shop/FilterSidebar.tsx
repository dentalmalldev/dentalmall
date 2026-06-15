'use client';

import { Box, Paper, Stack, Typography, Button, Chip } from '@mui/material';
import { FilterList } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { ProductFacets } from '@/types';
import { ShopFilters } from './ShopFilters';
import { ShopFilterValues, countActiveFilters } from './types';

interface FilterSidebarProps {
  values: ShopFilterValues;
  facets?: ProductFacets;
  onChange: (patch: Partial<ShopFilterValues>) => void;
  onClear: () => void;
}

// Desktop filter panel — sits below the category sidebar and sticks on scroll.
export function FilterSidebar({ values, facets, onChange, onClear }: FilterSidebarProps) {
  const t = useTranslations('shop');
  const activeCount = countActiveFilters(values);

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'sticky',
        top: 16,
        maxHeight: 'calc(100vh - 32px)',
        overflowY: 'auto',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, py: 1.5 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <FilterList fontSize="small" />
          <Typography fontWeight={700}>{t('filters')}</Typography>
          {activeCount > 0 && <Chip size="small" color="primary" label={activeCount} />}
        </Stack>
        {activeCount > 0 && (
          <Button size="small" onClick={onClear}>
            {t('clearAll')}
          </Button>
        )}
      </Stack>
      <Box>
        <ShopFilters values={values} facets={facets} onChange={onChange} />
      </Box>
    </Paper>
  );
}
