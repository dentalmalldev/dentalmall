'use client';

import { useState } from 'react';
import {
  Box,
  Stack,
  Pagination as MuiPagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Typography,
  IconButton,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { NavigateBefore, NavigateNext } from '@mui/icons-material';
import { useTranslations } from 'next-intl';

export interface PaginationControlProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Admin: render a page-size selector. */
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  /** Admin: render a "jump to page" input. */
  showJumpToPage?: boolean;
  /** 'range' → "Showing 1–24 of 547"; 'total' → "547 products total". */
  countVariant?: 'range' | 'total';
}

export function PaginationControl({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100, 200],
  showJumpToPage = false,
  countVariant = 'range',
}: PaginationControlProps) {
  const t = useTranslations('pagination');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [jumpValue, setJumpValue] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const goTo = (p: number) => {
    const clamped = Math.min(Math.max(1, p), totalPages);
    if (clamped !== page) onPageChange(clamped);
  };

  const handleJump = () => {
    const n = parseInt(jumpValue, 10);
    if (!isNaN(n)) goTo(n);
    setJumpValue('');
  };

  const countText =
    countVariant === 'total'
      ? t('totalCount', { count: total })
      : t('showing', { from, to, total });

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      alignItems="center"
      justifyContent="space-between"
      sx={{ mt: 3, width: '100%' }}
    >
      <Typography variant="body2" color="text.secondary">
        {countText}
      </Typography>

      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
        {/* Page controls */}
        {totalPages > 1 &&
          (isMobile ? (
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton size="small" disabled={page <= 1} onClick={() => goTo(page - 1)} aria-label={t('previous')}>
                <NavigateBefore />
              </IconButton>
              <Typography variant="body2">
                {t('pageOf', { page, total: totalPages })}
              </Typography>
              <IconButton size="small" disabled={page >= totalPages} onClick={() => goTo(page + 1)} aria-label={t('next')}>
                <NavigateNext />
              </IconButton>
            </Stack>
          ) : (
            <MuiPagination
              count={totalPages}
              page={page}
              onChange={(_, p) => goTo(p)}
              color="primary"
              shape="rounded"
              siblingCount={1}
              boundaryCount={1}
            />
          ))}

        {/* Jump to page (admin) */}
        {showJumpToPage && totalPages > 1 && (
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              type="number"
              placeholder={t('jumpPlaceholder')}
              value={jumpValue}
              onChange={(e) => setJumpValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJump();
              }}
              sx={{ width: 90 }}
              inputProps={{ min: 1, max: totalPages }}
            />
            <Button size="small" variant="outlined" onClick={handleJump}>
              {t('go')}
            </Button>
          </Stack>
        )}

        {/* Page size selector (admin) */}
        {onPageSizeChange && (
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel>{t('perPage')}</InputLabel>
            <Select
              label={t('perPage')}
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>
      <Box sx={{ display: { md: 'none' } }} />
    </Stack>
  );
}
