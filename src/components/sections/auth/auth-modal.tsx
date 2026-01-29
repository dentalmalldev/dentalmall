"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { useTranslations } from "next-intl";
import LogIn from "./log-in";
import { Alert, CircularProgress, IconButton, Stack, Tab, Tabs } from "@mui/material";
import { GoogleIcon } from "@/icons/google/google";
import OrDivider from "./or-divider";
import { CloseIcon, LeftIcon } from "@/icons";
import Register from "./register";
import { useAuth } from "@/providers";
import { FirebaseError } from "firebase/app";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { md: "540px", xs: "100vw" },
  bgcolor: "background.paper",
  borderRadius: { md: "30px", xs: "0px" },
  padding: "40px",
  height: { xs: "100vh", md: "auto" },
  maxHeight: { md: "90vh" },
  overflow: "auto",
};

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ onClose, open }: AuthModalProps) {
  const t = useTranslations("auth");
  const tv = useTranslations("validation");
  const { loginWithGoogle } = useAuth();

  const [value, setValue] = React.useState("authorization");
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [googleError, setGoogleError] = React.useState<string | null>(null);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
    setGoogleError(null);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      await loginWithGoogle();
      onClose();
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

  const handleSuccess = () => {
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <IconButton
          sx={{
            position: "absolute",
            right: "0",
            top: "10px",
            display: { xs: "none", md: "block" },
          }}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
        <IconButton
          sx={{
            position: "absolute",
            left: "0",
            top: "40px",
            display: { xs: "block", md: "none" },
          }}
          onClick={onClose}
        >
          <LeftIcon />
        </IconButton>
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
            <LogIn onSuccess={handleSuccess} />
          ) : (
            <Register onSuccess={handleSuccess} />
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
      </Box>
    </Modal>
  );
}
