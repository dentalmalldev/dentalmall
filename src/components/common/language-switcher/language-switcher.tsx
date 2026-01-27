'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Button, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import { locales, localeNames } from '@/i18n';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLocaleChange = (newLocale: string) => {
    // Remove current locale from pathname and add new locale
    const pathWithoutLocale = pathname.replace(`/${locale}`, '');
    router.push(`/${newLocale}${pathWithoutLocale}`);
    handleClose();
  };

  return (
    <>
      <Button
        onClick={handleClick}
        variant="outlined"
        sx={{
          minWidth: '60px',
          borderRadius: '100px',
          textTransform: 'uppercase',
          borderColor: '#5B6ECD',
          color: '#5B6ECD',
          '&:hover': {
            borderColor: '#4A5BC0',
            backgroundColor: 'rgba(91, 110, 205, 0.04)',
          }
        }}
      >
        {locale}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {locales.map((loc) => (
          <MenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            selected={loc === locale}
          >
            {localeNames[loc]}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
