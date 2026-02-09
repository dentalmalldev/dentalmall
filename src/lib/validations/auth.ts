import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'validation.required')
    .email('validation.invalidEmail'),
  password: z
    .string()
    .min(1, 'validation.required')
    .min(6, 'validation.minLength6'),
  remember: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    first_name: z
      .string()
      .min(1, 'validation.required')
      .min(2, 'validation.minLength2'),
    last_name: z
      .string()
      .min(1, 'validation.required')
      .min(2, 'validation.minLength2'),
    personal_id: z
      .string()
      .min(1, 'validation.required')
      .length(11, 'validation.personalIdLength')
      .regex(/^\d+$/, 'validation.personalIdDigits'),
    email: z
      .string()
      .min(1, 'validation.required')
      .email('validation.invalidEmail'),
    password: z
      .string()
      .min(1, 'validation.required')
      .min(6, 'validation.minLength6'),
    confirm_password: z.string().min(1, 'validation.required'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'validation.passwordMismatch',
    path: ['confirm_password'],
  });

export const updateProfileSchema = z.object({
  first_name: z
    .string()
    .min(1, 'validation.required')
    .min(2, 'validation.minLength2'),
  last_name: z
    .string()
    .min(1, 'validation.required')
    .min(2, 'validation.minLength2'),
  personal_id: z
    .string()
    .optional()
    .refine(
      (val) => !val || (val.length === 11 && /^\d+$/.test(val)),
      'validation.personalIdLength'
    ),
});

export const changePasswordSchema = z
  .object({
    current_password: z
      .string()
      .min(1, 'validation.required')
      .min(6, 'validation.minLength6'),
    new_password: z
      .string()
      .min(1, 'validation.required')
      .min(6, 'validation.minLength6'),
    confirm_password: z.string().min(1, 'validation.required'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'validation.passwordMismatch',
    path: ['confirm_password'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
