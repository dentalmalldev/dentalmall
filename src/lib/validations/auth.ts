import * as Yup from "yup";

/* ---------------- LOGIN ---------------- */

export const loginSchema = Yup.object({
  email: Yup.string()
    .required("validation.required")
    .email("validation.invalidEmail"),

  password: Yup.string()
    .required("validation.required")
    .min(6, "validation.minLength6"),

  remember: Yup.boolean().optional(),
});

/* ---------------- REGISTER ---------------- */

export const registerSchema = Yup.object({
  first_name: Yup.string()
    .required("validation.required")
    .min(2, "validation.minLength2"),

  last_name: Yup.string()
    .required("validation.required")
    .min(2, "validation.minLength2"),

  personal_id: Yup.string()
    .required("validation.required")
    .length(11, "validation.personalIdLength")
    .matches(/^\d+$/, "validation.personalIdDigits"),

  email: Yup.string()
    .required("validation.required")
    .email("validation.invalidEmail"),

  password: Yup.string()
    .required("validation.required")
    .min(6, "validation.minLength6"),

  confirm_password: Yup.string()
    .required("validation.required")
    .oneOf([Yup.ref("password")], "validation.passwordMismatch"),
});

/* ---------------- UPDATE PROFILE ---------------- */

export const updateProfileSchema = Yup.object({
  first_name: Yup.string()
    .required("validation.required")
    .min(2, "validation.minLength2"),

  last_name: Yup.string()
    .required("validation.required")
    .min(2, "validation.minLength2"),

  personal_id: Yup.string()
    .optional()
    .test(
      "personal-id",
      "validation.personalIdLength",
      (val) => !val || (val.length === 11 && /^\d+$/.test(val))
    ),
});

/* ---------------- CHANGE PASSWORD ---------------- */

export const changePasswordSchema = Yup.object({
  current_password: Yup.string()
    .required("validation.required")
    .min(6, "validation.minLength6"),

  new_password: Yup.string()
    .required("validation.required")
    .min(6, "validation.minLength6"),

  confirm_password: Yup.string()
    .required("validation.required")
    .oneOf([Yup.ref("new_password")], "validation.passwordMismatch"),
});

/* ---------------- TYPES ---------------- */

export type LoginFormValues = Yup.InferType<typeof loginSchema>;
export type RegisterFormValues = Yup.InferType<typeof registerSchema>;
export type UpdateProfileFormValues = Yup.InferType<typeof updateProfileSchema>;
export type ChangePasswordFormValues = Yup.InferType<typeof changePasswordSchema>;
