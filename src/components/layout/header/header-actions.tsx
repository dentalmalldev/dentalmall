"use client";

import { CartIcon, ProfileIcon } from "@/icons";
import {
  Badge,
  Button,
  Stack,
} from "@mui/material";
import { useTranslations, useLocale } from "next-intl";
import { LanguageSwitcher } from "@/components/common";
import { useCart, useAuth, useAuthModal } from "@/providers";
import Link from "next/link";
import { useRouter } from "next/navigation";

export const HeaderActions = () => {
  const t = useTranslations("actions");
  const locale = useLocale();
  const { user, dbUser } = useAuth();
  const { openAuthModal } = useAuthModal();

  const router = useRouter();

  const { items } = useCart();

  const userDisplayName = user
    ? dbUser?.first_name || user.displayName?.split(" ")[0] || t("login")
    : t("login");

  return (
    <Stack direction="row" gap={1} alignItems="center">
      {/* Cart Button */}
      <Button
        component={Link}
        href={`/${locale}/cart`}
        startIcon={
          <Badge
            badgeContent={items.length}
            color="secondary"
            sx={{
              "& .MuiBadge-badge": {
                backgroundColor: "#9292FF",
                color: "white",
                fontSize: "10px",
                minWidth: "18px",
                height: "18px",
              },
            }}
          >
            <CartIcon />
          </Badge>
        }
        sx={{
          color: "#5B6ECD",
          "&:hover": {
            backgroundColor: "rgba(91, 110, 205, 0.08)",
          },
        }}
      >
        {t("cart")}
      </Button>

      {/* Language Switcher */}
      <LanguageSwitcher />

      <Button
        startIcon={<ProfileIcon />}
        variant="contained"
        onClick={() => {
          if (!user) {
            openAuthModal();
          } else {
            router.push(`/profile`);
          }
        }}
        sx={{
          borderRadius: "100px",
          padding: "10px 16px",
        }}
      >
        {userDisplayName}
      </Button>
    </Stack>
  );
};
