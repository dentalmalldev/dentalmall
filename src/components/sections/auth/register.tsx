"use client";

import {
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";

export default function Register() {
  const t = useTranslations("auth");
  return (
    <Stack gap={3}>
      <TextField
        placeholder={t("fillIn") + " " + t("register.name")}
        label={t("register.name")}
        name="first_name"
      />
      <TextField
        placeholder={t("fillIn") + " " + t("register.lastName")}
        label={t("register.lastName")}
        name="last_name"
      />
      <TextField
        placeholder={t("fillIn") + " " + t("register.personalId")}
        label={t("register.personalId")}
        name="personal_id"
      />
      <TextField
        placeholder={t("fillIn") + " " + t("email")}
        label={t("email")}
        type="email"
        name="email"
      />
      <TextField
        placeholder={t("fillIn") + " " + t("password")}
        label={t("password")}
        type="password"
        name="password"
      />
      <TextField
        placeholder={t("fillIn") + " " + t("password")}
        label={t("confirm") + " " + t("password")}
        type="password"
        name="confirm_password"
      />
      <Button variant="contained">{t("register.title")}</Button>
    </Stack>
  );
}
