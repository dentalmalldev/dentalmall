'use client';

import { CartIcon, ProfileIcon } from "@/icons";
import { Button, Stack } from "@mui/material";
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/common';

export const HeaderActions = () => {
  const t = useTranslations('actions');

  return (
    <Stack direction="row" gap={1}>
      <Button startIcon={<CartIcon />} sx={{ color: "#5B6ECD" }}>
        {t('cart')}
      </Button>
      <LanguageSwitcher />
      <Button
        startIcon={<ProfileIcon />}
        variant="contained"
        sx={{ borderRadius: "100px", padding: "10px 12px" }}
      >
        {t('login')}
      </Button>
    </Stack>
  );
};
