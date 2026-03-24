import * as Yup from "yup";
import { z } from "zod";

export const addressSchema = Yup.object({
  recipient_name: Yup.string()
    .required("validation.required")
    .min(2, "validation.minLength2"),

  mobile_number: Yup.string()
    .required("validation.required")
    .min(5, "validation.minLength5"),

  city: Yup.string()
    .required("validation.required")
    .min(2, "validation.minLength2"),

  address: Yup.string()
    .required("validation.required")
    .min(2, "validation.minLength2"),

  postal_code: Yup.string().optional(),

  is_default: Yup.boolean().optional(),
});

export type AddressFormValues = Yup.InferType<typeof addressSchema>;

// --- Zod schema (used by backend API routes) ---

export const addressZodSchema = z.object({
  recipient_name: z.string().min(2),
  mobile_number: z.string().min(5),
  city: z.string().min(2),
  address: z.string().min(2),
  postal_code: z.string().optional(),
  is_default: z.boolean().optional(),
});
