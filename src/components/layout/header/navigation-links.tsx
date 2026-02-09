"use client";

import Link from "next/link";
import { NavLinkIcon } from "@/icons";
import { NAV_ITEMS } from "@/constants";
import { Stack, Typography } from "@mui/material";
import { useTranslations, useLocale } from "next-intl";

export function NavigationLinks() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <Stack
      direction="row"
      gap={4}
      sx={{
        overflowX: "auto",
        whiteSpace: "nowrap",
        "&::-webkit-scrollbar": { display: "none" },
        scrollbarWidth: "none",
      }}
    >
      {NAV_ITEMS.map((item, index) => (
        <Link
          key={index}
          href={
            item.translationKey === "navigation.courses"
              ? item.href
              : `/${locale}${item.href}`
          }
          style={{ textDecoration: "none" }}
        >
          <Stack direction="row" alignItems="center" gap={1}>
            <NavLinkIcon />
            <Typography color="text.primary" fontSize="14px">
              {t(item.translationKey)}
            </Typography>
          </Stack>
        </Link>
      ))}
    </Stack>
  );
}
