'use client';

import { Paper, Stack, Typography, Button, Box, Link as MuiLink } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';
import { useTranslations } from 'next-intl';

interface BulkActionsBarProps {
  selectedCount: number;
  totalMatching: number;
  allMatching: boolean;
  /** Whether the "select all N matching filters" affordance should show. */
  canSelectAllMatching: boolean;
  onSelectAllMatching: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export function BulkActionsBar({
  selectedCount,
  totalMatching,
  allMatching,
  canSelectAllMatching,
  onSelectAllMatching,
  onEdit,
  onDelete,
  onClear,
}: BulkActionsBarProps) {
  const t = useTranslations('admin');

  return (
    <Paper
      sx={{
        position: 'sticky',
        top: 8,
        zIndex: 5,
        p: { xs: 1.5, md: 2 },
        mb: 2,
        borderRadius: '12px',
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={1.5}
      >
        <Box>
          <Typography fontWeight={600}>
            {allMatching
              ? t('bulkSelectedAllMatching', { count: totalMatching })
              : t('bulkSelectedCount', { count: selectedCount })}
          </Typography>
          {canSelectAllMatching && !allMatching && (
            <MuiLink
              component="button"
              type="button"
              onClick={onSelectAllMatching}
              sx={{ color: 'inherit', textDecorationColor: 'currentColor', fontSize: 14 }}
            >
              {t('bulkSelectAllMatching', { count: totalMatching })}
            </MuiLink>
          )}
        </Box>

        <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
          <Button
            size="small"
            variant="contained"
            color="inherit"
            startIcon={<EditIcon />}
            onClick={onEdit}
            sx={{ color: 'primary.main', bgcolor: 'common.white' }}
          >
            {t('bulkEditSelected')}
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={onDelete}
            sx={{ color: 'common.white', borderColor: 'common.white' }}
          >
            {t('bulkDeleteSelected')}
          </Button>
          <Button
            size="small"
            startIcon={<CloseIcon />}
            onClick={onClear}
            sx={{ color: 'common.white' }}
          >
            {t('bulkClearSelection')}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
