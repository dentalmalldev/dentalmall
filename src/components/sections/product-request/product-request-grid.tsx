'use client';

import {
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField as MuiTextField,
  Tooltip,
} from '@mui/material';
import { DeleteOutline as DeleteIcon } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { MAX_PHOTO_SIZE_MB } from '@/lib/validations/product-request';
import { PhotoField } from './photo-field';
import { ProductField, ProductRow, REQUIRED_FIELDS, RowErrors, TEXT_FIELD_LIMITS, TextField } from './product-rows';
import type { ProductRequestFormState } from './use-product-request-form';

const COLUMNS: { field: ProductField; width: string }[] = [
  { field: 'name', width: '16%' },
  { field: 'invoice_name', width: '16%' },
  { field: 'description', width: '21%' },
  { field: 'estimated_price', width: '11%' },
  { field: 'store', width: '12%' },
  { field: 'photo_url', width: '9%' },
  { field: 'quantity', width: '7%' },
];

const cellSx = { border: '1px solid', borderColor: 'divider', px: 1, py: 0.5 };

export function ProductRequestGrid({ form }: { form: ProductRequestFormState }) {
  const t = useTranslations('productRequest');
  const tRoot = useTranslations();

  const message = (key?: string) => (key ? tRoot(key, { max: MAX_PHOTO_SIZE_MB }) : undefined);

  const errorCellSx = (errors: RowErrors, field: ProductField) => ({
    ...cellSx,
    ...(errors[field] ? { backgroundColor: 'rgba(244, 67, 54, 0.08)' } : {}),
  });

  const input = (row: ProductRow, field: TextField | 'quantity', errors: RowErrors) => (
    <Tooltip title={message(errors[field]) ?? ''}>
      <MuiTextField
        fullWidth
        variant="standard"
        multiline={field === 'description'}
        maxRows={3}
        value={row[field]}
        error={Boolean(errors[field])}
        onChange={(event) =>
          form.updateRow(row.id, {
            [field]: field === 'quantity' ? event.target.value.replace(/\D/g, '') : event.target.value,
          })
        }
        slotProps={{
          input: { disableUnderline: true },
          htmlInput: {
            'aria-label': t(`fields.${field}`),
            ...(field === 'quantity' ? { inputMode: 'numeric' } : { maxLength: TEXT_FIELD_LIMITS[field] }),
          },
        }}
      />
    </Tooltip>
  );

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
      {/* Fixed layout: the columns share the available width, so nothing scrolls sideways. */}
      <Table size="small" sx={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...cellSx, width: '4%', px: 0.25, textAlign: 'center' }}>#</TableCell>
            {COLUMNS.map(({ field, width }) => (
              <TableCell
                key={field}
                sx={{ ...cellSx, width, fontWeight: 600, fontSize: '13px', overflowWrap: 'break-word' }}
              >
                {t(`fields.${field}`)}
                {REQUIRED_FIELDS.includes(field) ? ' *' : ''}
              </TableCell>
            ))}
            <TableCell sx={{ ...cellSx, width: '4%', px: 0.25 }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {form.rows.map((row, index) => {
            const errors = form.rowErrors[row.id] ?? {};
            return (
              <TableRow key={row.id}>
                <TableCell sx={{ ...cellSx, px: 0.25, textAlign: 'center', color: 'text.secondary' }}>{index + 1}</TableCell>
                <TableCell sx={errorCellSx(errors, 'name')}>{input(row, 'name', errors)}</TableCell>
                <TableCell sx={errorCellSx(errors, 'invoice_name')}>{input(row, 'invoice_name', errors)}</TableCell>
                <TableCell sx={errorCellSx(errors, 'description')}>{input(row, 'description', errors)}</TableCell>
                <TableCell sx={errorCellSx(errors, 'estimated_price')}>{input(row, 'estimated_price', errors)}</TableCell>
                <TableCell sx={errorCellSx(errors, 'store')}>{input(row, 'store', errors)}</TableCell>
                <TableCell sx={{ ...errorCellSx(errors, 'photo_url'), px: 0.5 }}>
                  <Tooltip title={message(errors.photo_url) ?? ''}>
                    <span>
                      <PhotoField
                        compact
                        url={row.photo_url}
                        uploading={form.uploadingIds.includes(row.id)}
                        onChoose={(file) => form.choosePhoto(row.id, file)}
                        onRemove={() => form.updateRow(row.id, { photo_url: null })}
                      />
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={errorCellSx(errors, 'quantity')}>{input(row, 'quantity', errors)}</TableCell>
                <TableCell sx={{ ...cellSx, px: 0.25, textAlign: 'center' }}>
                  <Tooltip title={t('deleteRow')}>
                    <IconButton size="small" onClick={() => form.deleteRow(row.id)} aria-label={t('deleteRow')}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
