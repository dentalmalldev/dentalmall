"use client";

import { Button, Stack, Typography } from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

export default function ProductNotFound() {
  const t = useTranslations("productsSection");
  const c = useTranslations("categoriesSection");
  const locale = useLocale();

  return (
    <Stack
      sx={{ width: "100%" }}
      gap={3}
      justifyContent="center"
      alignItems="center"
    >
      <Image
        src="/assets/product-not-found.png"
        width={194}
        height={192}
        alt="dentalmall"
      />
      <Typography>{t("noProducts")}</Typography>
      <Link href={`/${locale}/categories`}>
        <Button variant="contained">{c("title")}</Button>
      </Link>
    </Stack>
  );
}
