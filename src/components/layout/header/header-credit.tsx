"use client";

import Link from "next/link";
import { ButtonBase, Tooltip, Typography } from "@mui/material";
import { AccountBalanceWalletOutlined } from "@mui/icons-material";
import { useLocale, useTranslations } from "next-intl";
import { useMyCredit } from "@/hooks/useMyCredit";

/**
 * The customer's store credit as a small pill in the header, linking to the
 * profile page where the balance is shown. Renders nothing unless the balance
 * is above 0. Desktop size matches the 32px product-request button beside it;
 * `compact` is the phone size, next to the search field.
 */
export const HeaderCredit = ({ compact = false }: { compact?: boolean }) => {
  const t = useTranslations("credit");
  const locale = useLocale();
  const { balance } = useMyCredit();

  if (balance <= 0) return null;

  const amount = `₾${balance.toFixed(2)}`;

  return (
    <Tooltip title={t("balance")}>
      <ButtonBase
        component={Link}
        href={`/${locale}/profile?tab=info`}
        aria-label={`${t("balance")}: ${amount}`}
        sx={{
          flexShrink: 0,
          gap: compact ? 0.5 : 0.75,
          height: compact ? 28 : 32,
          px: compact ? 1 : 1.5,
          borderRadius: "100px",
          backgroundColor: "rgba(22, 163, 74, 0.1)",
          color: "#15803D",
          transition: "background-color 0.2s",
          "&:hover": { backgroundColor: "rgba(22, 163, 74, 0.18)" },
        }}
      >
        <AccountBalanceWalletOutlined sx={{ fontSize: compact ? 16 : 20 }} />
        <Typography component="span" sx={{ fontSize: compact ? 12 : 14, fontWeight: 700, whiteSpace: "nowrap" }}>
          {amount}
        </Typography>
      </ButtonBase>
    </Tooltip>
  );
};
