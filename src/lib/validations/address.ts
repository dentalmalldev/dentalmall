import { z } from 'zod';

export const addressSchema = z.object({
  city: z
    .string()
    .min(1, 'validation.required')
    .min(2, 'validation.minLength2'),
  address: z
    .string()
    .min(1, 'validation.required')
    .min(2, 'validation.minLength2'),
  is_default: z.boolean().optional(),
});

export type AddressFormValues = z.infer<typeof addressSchema>;
