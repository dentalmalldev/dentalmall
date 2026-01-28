"use client";

import { CartIcon, ProfileIcon } from "@/icons";
import { Button, Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/common";
import AuthModal from "@/components/sections/auth/auth-modal";
import { useState } from "react";

export const HeaderActions = () => {
  const t = useTranslations("actions");

  const [openAuthModal, setOpenAuthModal] = useState(false);

  return (
    <Stack direction="row" gap={1}>
      <Button startIcon={<CartIcon />} sx={{ color: "#5B6ECD" }}>
        {t("cart")}
      </Button>
      <LanguageSwitcher />
      <Button
        startIcon={<ProfileIcon />}
        variant="contained"
        onClick={() => setOpenAuthModal(true)}
        sx={{ borderRadius: "100px", padding: "10px 12px" }}
      >
        {t("login")}
      </Button>
      <AuthModal open={openAuthModal} onClose={() => setOpenAuthModal(false)} />
    </Stack>
  );
};
