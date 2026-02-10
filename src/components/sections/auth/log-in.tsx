"use client";

import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useFormik } from "formik";
import { loginSchema, LoginFormValues } from "@/lib/validations/auth";
import { useAuth } from "@/providers";
import { useState } from "react";
import { FirebaseError } from "firebase/app";

interface LogInProps {
  onSuccess?: () => void;
}

export default function LogIn({ onSuccess }: LogInProps) {
  const t = useTranslations("auth");
  const tv = useTranslations("validation");
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik<LoginFormValues>({
    initialValues: {
      email: "",
      password: "",
      remember: false,
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      setError(null);
      try {
        await login({ email: values.email, password: values.password });
        onSuccess?.();
      } catch (err) {
        if (err instanceof FirebaseError) {
          switch (err.code) {
            case "auth/user-not-found":
            case "auth/wrong-password":
            case "auth/invalid-credential":
              setError(tv("invalidCredentials"));
              break;
            case "auth/too-many-requests":
              setError(tv("tooManyRequests"));
              break;
            default:
              setError(tv("unknownError"));
          }
        } else {
          setError(tv("unknownError"));
        }
      }
    },
  });

  const getFieldError = (field: keyof LoginFormValues) => {
    if (formik.touched[field] && formik.errors[field]) {
      const errorKey = formik.errors[field] as string;
      return tv(errorKey.replace("validation.", ""));
    }
    return undefined;
  };

  return (
    <form onSubmit={formik.handleSubmit}>
      <Stack gap={3}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          placeholder={t("fillIn") + " " + t("email")}
          label={t("email")}
          type="email"
          name="email"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.email && Boolean(formik.errors.email)}
          helperText={getFieldError("email")}
        />

        <Stack>
          <TextField
            placeholder={t("fillIn") + " " + t("password")}
            label={t("password")}
            type="password"
            name="password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={getFieldError("password")}
          />
          <Stack
            justifyContent="space-between"
            alignItems="center"
            direction="row"
          >
            <FormControlLabel
              control={
                <Checkbox
                  name="remember"
                  checked={formik.values.remember}
                  onChange={formik.handleChange}
                />
              }
              label={<Typography variant="caption">{t("remember")}</Typography>}
            />
            <Typography variant="caption" sx={{ cursor: "pointer" }}>
              {t("forgot") + " " + t("password")}?
            </Typography>
          </Stack>
        </Stack>

        <Button
          variant="contained"
          type="submit"
          disabled={formik.isSubmitting}
          startIcon={formik.isSubmitting ? <CircularProgress size={20} /> : null}
        >
          {t("login")}
        </Button>
      </Stack>
    </form>
  );
}
