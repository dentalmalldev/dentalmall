"use client";

import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  TextField,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useFormik } from "formik";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { registerSchema, RegisterFormValues } from "@/lib/validations/auth";
import { useAuth } from "@/providers";
import { useState } from "react";
import { FirebaseError } from "firebase/app";

interface RegisterProps {
  onSuccess?: () => void;
}

export default function Register({ onSuccess }: RegisterProps) {
  const t = useTranslations("auth");
  const tv = useTranslations("validation");
  const { register } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik<RegisterFormValues>({
    initialValues: {
      first_name: "",
      last_name: "",
      personal_id: "",
      email: "",
      password: "",
      confirm_password: "",
    },
    validationSchema: toFormikValidationSchema(registerSchema),
    onSubmit: async (values) => {
      setError(null);
      try {
        await register({
          email: values.email,
          password: values.password,
          first_name: values.first_name,
          last_name: values.last_name,
          personal_id: values.personal_id,
        });
        onSuccess?.();
      } catch (err) {
        if (err instanceof FirebaseError) {
          switch (err.code) {
            case "auth/email-already-in-use":
              setError(tv("emailInUse"));
              break;
            case "auth/weak-password":
              setError(tv("weakPassword"));
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

  const getFieldError = (field: keyof RegisterFormValues) => {
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
          placeholder={t("fillIn") + " " + t("register.name")}
          label={t("register.name")}
          name="first_name"
          value={formik.values.first_name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.first_name && Boolean(formik.errors.first_name)}
          helperText={getFieldError("first_name")}
        />

        <TextField
          placeholder={t("fillIn") + " " + t("register.lastName")}
          label={t("register.lastName")}
          name="last_name"
          value={formik.values.last_name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.last_name && Boolean(formik.errors.last_name)}
          helperText={getFieldError("last_name")}
        />

        <TextField
          placeholder={t("fillIn") + " " + t("register.personalId")}
          label={t("register.personalId")}
          name="personal_id"
          value={formik.values.personal_id}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.personal_id && Boolean(formik.errors.personal_id)}
          helperText={getFieldError("personal_id")}
        />

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

        <TextField
          placeholder={t("fillIn") + " " + t("password")}
          label={t("confirm") + " " + t("password")}
          type="password"
          name="confirm_password"
          value={formik.values.confirm_password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.confirm_password && Boolean(formik.errors.confirm_password)}
          helperText={getFieldError("confirm_password")}
        />

        <Button
          variant="contained"
          type="submit"
          disabled={formik.isSubmitting}
          startIcon={formik.isSubmitting ? <CircularProgress size={20} /> : null}
        >
          {t("register.title")}
        </Button>
      </Stack>
    </form>
  );
}
