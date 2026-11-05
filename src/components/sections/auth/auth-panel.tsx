"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import LogIn from "./log-in";
import { Alert, CircularProgress, Stack, Tab, Tabs } from "@mui/material";
import { GoogleIcon } from "@/icons/google/google";
import OrDivider from "./or-divider";
import Register from "./register";
import { useAuth } from "@/providers";
import { FirebaseError } from "firebase/app";

interface AuthPanelProps {
  initialTab?: "authorization" | "register";
  /** Called after a successful sign-in, registration or Google sign-in. */
  onSuccess: () => void;
}

/** The sign-in forms, shared by the auth modal and the login page. */
export default function AuthPanel({ initialTab = "authorization", onSuccess }: AuthPanelProps) {
  const t = useTranslations("auth");
  const tv = useTranslations("validation");
  const { loginWithGoogle } = useAuth();

  const [value, setValue] = React.useState(initialTab);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [googleError, setGoogleError] = React.useState<string | null>(null);

  const handleChange = (event: React.SyntheticEvent, newValue: "authorization" | "register") => {
    setValue(newValue);
    setGoogleError(null);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      await loginWithGoogle();
      onSuccess();
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/popup-closed-by-user":
            break;
          case "auth/cancelled-popup-request":
            break;
          default:
            setGoogleError(tv("unknownError"));
        }
      } else {
        setGoogleError(tv("unknownError"));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Stack gap={3}>
      <Typography id="modal-modal-title" variant="h3" textAlign="center">
        {t("title")}
      </Typography>
      <Box sx={{ width: "100%" }}>
        <Tabs value={value} onChange={handleChange} variant="fullWidth">
          <Tab value="authorization" label={t("authorization")} />
          <Tab value="register" label={t("register.title")} />
        </Tabs>
      </Box>
      {value === "authorization" ? (
        <LogIn onSuccess={onSuccess} />
      ) : (
        <Register onSuccess={onSuccess} />
      )}
      <OrDivider />
      {googleError && <Alert severity="error">{googleError}</Alert>}
      <Button
        startIcon={
          googleLoading ? (
            <CircularProgress size={20} />
          ) : (
            <GoogleIcon />
          )
        }
        variant="outlined"
        sx={{ borderColor: "#D9D9D9" }}
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
      >
        Google
      </Button>
    </Stack>
  );
}
