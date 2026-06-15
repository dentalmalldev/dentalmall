'use client';

import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useTranslations } from 'next-intl';
import { ShopSortKey, SHOP_SORT_KEYS } from './types';

interface SortDropdownProps {
  value: ShopSortKey;
  onChange: (value: ShopSortKey) => void;
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const t = useTranslations('shop');
  return (
    <FormControl size="small" sx={{ minWidth: 200 }}>
      <InputLabel>{t('sortBy')}</InputLabel>
      <Select
        label={t('sortBy')}
        value={value}
        onChange={(e) => onChange(e.target.value as ShopSortKey)}
      >
        {SHOP_SORT_KEYS.map((key) => (
          <MenuItem key={key} value={key}>
            {t(`sort_${key}`)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
