'use client';

import { useEffect, useState } from 'react';
import {
  Drawer,
  Box,
  Stack,
  Typography,
  Button,
  IconButton,
  Divider,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { ProductFacets } from '@/types';
import { ShopFilters } from './ShopFilters';
import { ShopFilterValues, EMPTY_SHOP_FILTERS, countActiveFilters } from './types';

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  initialValues: ShopFilterValues;
  facets?: ProductFacets;
  onApply: (values: ShopFilterValues) => void;
}

// Mobile full-height drawer. Edits a local draft and commits on "Apply" so the
// grid isn't re-queried on every tap.
export function FilterDrawer({ open, onClose, initialValues, facets, onApply }: FilterDrawerProps) {
  const t = useTranslations('shop');
  const [draft, setDraft] = useState<ShopFilterValues>(initialValues);

  // Re-seed the draft from the committed filters each time the drawer opens.
  useEffect(() => {
    if (open) setDraft(initialValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const activeCount = countActiveFilters(draft);

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { height: '90vh', borderTopLeftRadius: 16, borderTopRightRadius: 16 } }}
    >
      <Stack sx={{ height: '100%' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            {t('filters')}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            {activeCount > 0 && (
              <Button size="small" onClick={() => setDraft(EMPTY_SHOP_FILTERS)}>
                {t('clearAll')}
              </Button>
            )}
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Stack>
        </Stack>
        <Divider />

        {/* Scrollable filter body */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 2 }}>
          <ShopFilters
            values={draft}
            facets={facets}
            onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
          />
        </Box>

        {/* Sticky apply footer */}
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            {t('apply')}
          </Button>
        </Box>
      </Stack>
    </Drawer>
  );
}
