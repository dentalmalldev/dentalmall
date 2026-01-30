import { z } from 'zod';

export const clinicRequestSchema = z.object({
  clinic_name: z
    .string()
    .min(1, 'validation.required')
    .min(2, 'validation.minLength2'),
  identification_number: z
    .string()
    .min(1, 'validation.required'),
  email: z
    .string()
    .min(1, 'validation.required')
    .email('validation.invalidEmail'),
  description: z.string().optional(),
  city: z
    .string()
    .min(1, 'validation.required'),
  address: z
    .string()
    .min(1, 'validation.required'),
  phone_number: z
    .string()
    .min(1, 'validation.required'),
});

export type ClinicRequestFormValues = z.infer<typeof clinicRequestSchema>;
