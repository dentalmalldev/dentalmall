import * as Yup from "yup";
import { z } from "zod";

export const addressSchema = Yup.object({
  city: Yup.string()
    .required("validation.required")
    .min(2, "validation.minLength2"),

  address: Yup.string()
    .required("validation.required")
    .min(2, "validation.minLength2"),

  is_default: Yup.boolean().optional(),
});

export type AddressFormValues = Yup.InferType<typeof addressSchema>;

// --- Zod schema (used by backend API routes) ---

export const addressZodSchema = z.object({
  city: z.string().min(2),
  address: z.string().min(2),
  is_default: z.boolean().optional(),
});
