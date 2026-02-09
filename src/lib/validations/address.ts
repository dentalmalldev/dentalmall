import * as Yup from "yup";

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
