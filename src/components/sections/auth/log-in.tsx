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

export default function LogIn() {
  const t = useTranslations("auth");
  return (
    <Stack gap={3}>
      <TextField
        placeholder={t("fillIn") + " " + t("email")}
        label={t("email")}
        type="email"
        name="email"
      />
      <Stack>
        <TextField
          placeholder={t("fillIn") + " " + t("password")}
          label={t("password")}
          type="password"
          name="password"
        />
        <Stack
          justifyContent="space-between"
          alignItems="center"
          direction="row"
        >
          <FormControlLabel
            control={<Checkbox defaultChecked />}
            label={<Typography variant="caption">{t("remember")}</Typography>}
          />
          <Typography variant="caption">
            {t("forgot") + " " + t("password")}?
          </Typography>
        </Stack>
      </Stack>

      <Button variant="contained">{t("login")}</Button>
    </Stack>
  );
}
