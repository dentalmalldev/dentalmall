"use client";

import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers";
import { useState } from "react";
import { useFormik } from "formik";
import { changePasswordSchema } from "@/lib/validations/auth";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

export function ChangePassword() {
  const t = useTranslations("profile");
  const tv = useTranslations("validation");
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
    validationSchema: changePasswordSchema,
    onSubmit: async (values, { resetForm }) => {
      setError(null);
      setSuccess(null);

      if (!user || !user.email) return;

      try {
        const credential = EmailAuthProvider.credential(
          user.email,
          values.current_password,
        );
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, values.new_password);
        setSuccess(t("passwordChanged"));
        resetForm();
      } catch (err: any) {
        if (
          err.code === "auth/wrong-password" ||
          err.code === "auth/invalid-credential"
        ) {
          setError(t("wrongPassword"));
        } else if (err.code === "auth/too-many-requests") {
          setError(tv("tooManyRequests"));
        } else {
          setError(tv("unknownError"));
        }
      }
    },
  });

  const getFieldError = (field: keyof typeof formik.values) => {
    if (formik.touched[field] && formik.errors[field]) {
      const errorKey = formik.errors[field] as string;
      if (errorKey.startsWith("validation.")) {
        return tv(errorKey.replace("validation.", ""));
      }
      return errorKey;
    }
    return undefined;
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        {t("changePassword")}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t("currentPassword")}
            </Typography>
            <TextField
              fullWidth
              type="password"
              name="current_password"
              value={formik.values.current_password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.current_password &&
                Boolean(formik.errors.current_password)
              }
              helperText={getFieldError("current_password")}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }} />

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t("newPassword")}
            </Typography>
            <TextField
              fullWidth
              type="password"
              name="new_password"
              value={formik.values.new_password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.new_password &&
                Boolean(formik.errors.new_password)
              }
              helperText={getFieldError("new_password")}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t("confirmPassword")}
            </Typography>
            <TextField
              fullWidth
              type="password"
              name="confirm_password"
              value={formik.values.confirm_password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.confirm_password &&
                Boolean(formik.errors.confirm_password)
              }
              helperText={getFieldError("confirm_password")}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={formik.isSubmitting}
              sx={{
                borderRadius: "12px",
                px: 6,
                py: 1.5,
                mt: 2,
              }}
            >
              {formik.isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                t("save")
              )}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
