import * as Yup from "yup";

export const clinicRequestSchema = Yup.object({
  clinic_name: Yup.string()
    .required("validation.required")
    .min(2, "validation.minLength2"),

  identification_number: Yup.string()
    .required("validation.required"),

  email: Yup.string()
    .required("validation.required")
    .email("validation.invalidEmail"),

  description: Yup.string().optional(),

  city: Yup.string()
    .required("validation.required"),

  address: Yup.string()
    .required("validation.required"),

  phone_number: Yup.string()
    .required("validation.required"),
});

export type ClinicRequestFormValues = Yup.InferType<typeof clinicRequestSchema>;
