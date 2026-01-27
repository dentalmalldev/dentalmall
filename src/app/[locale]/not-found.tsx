"use client";

import Image from "next/image";
import Link from "next/link";
import { Button, Stack, Typography } from "@mui/material";
import { useTranslations, useLocale } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('errors');
  const tActions = useTranslations('actions');
  const locale = useLocale();

  return (
    <Stack
      sx={{
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        padding: 3,
      }}
    >
      <Image
        src="/assets/not-found.png"
        alt="Page not found"
        width={400}
        height={300}
        style={{ objectFit: "contain" }}
      />

      <Stack direction="column" gap={2} mt={4}>
        <Typography textAlign="center">{t('pageNotFound')}</Typography>
        <Button variant="contained" component={Link} href={`/${locale}`}>
          {tActions('backToHome')}
        </Button>
      </Stack>
    </Stack>
  );
}
