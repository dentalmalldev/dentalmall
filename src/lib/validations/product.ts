import { z } from 'zod';
import * as yup from 'yup';

// --- Zod schemas (used by backend API routes) ---

export const variantOptionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Option name is required'),
  name_ka: z.string().min(1, 'Georgian option name is required'),
  price: z.number().positive('Price must be positive'),
  sale_price: z.number().positive('Sale price must be positive').optional().nullable(),
  discount_percent: z.number().min(0).max(100).optional().nullable(),
  stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
});

export const variantTypeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Variant type name is required'),
  name_ka: z.string().min(1, 'Georgian variant type name is required'),
  options: z.array(variantOptionSchema).min(1, 'At least one option is required'),
});

export const createProductSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  name_ka: z.string().min(2, 'Georgian name must be at least 2 characters'),
  description: z.string().optional(),
  description_ka: z.string().optional(),
  manufacturer: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  sale_price: z.number().positive('Sale price must be positive').optional().nullable(),
  discount_percent: z.number().min(0).max(100).optional().nullable(),
  sku: z.string().min(1, 'SKU is required'),
  stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
  category_id: z.string().min(1, 'Category is required'),
  vendor_id: z.string().optional().nullable(),
  variant_types: z.array(variantTypeSchema).optional().default([]),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductFormValues = z.infer<typeof createProductSchema>;
export type UpdateProductFormValues = z.infer<typeof updateProductSchema>;
export type VariantOptionFormValues = z.infer<typeof variantOptionSchema>;
export type VariantTypeFormValues = z.infer<typeof variantTypeSchema>;

// --- Yup schemas (used by frontend forms) ---

export const variantOptionYupSchema = yup.object({
  id: yup.string(),
  name: yup.string().min(1, 'Option name is required').required('Option name is required'),
  name_ka: yup.string().min(1, 'Georgian option name is required').required('Georgian option name is required'),
  price: yup.number().positive('Price must be positive').required('Price is required'),
  sale_price: yup.number().positive('Sale price must be positive').nullable().optional(),
  discount_percent: yup.number().min(0).max(100).nullable().optional(),
  stock: yup.number().integer().min(0, 'Stock cannot be negative').default(0).required(),
});

export const variantTypeYupSchema = yup.object({
  id: yup.string(),
  name: yup.string().min(1, 'Variant type name is required').required('Variant type name is required'),
  name_ka: yup.string().min(1, 'Georgian variant type name is required').required('Georgian variant type name is required'),
  options: yup.array(variantOptionYupSchema).min(1, 'At least one option is required').required(),
});

export const createProductYupSchema = yup.object({
  name: yup.string().min(2, 'Name must be at least 2 characters').required('Name is required'),
  name_ka: yup.string().min(2, 'Georgian name must be at least 2 characters').required('Georgian name is required'),
  description: yup.string().optional(),
  description_ka: yup.string().optional(),
  manufacturer: yup.string().optional(),
  price: yup.number().positive('Price must be positive').required('Price is required'),
  sale_price: yup.number().positive('Sale price must be positive').nullable().optional(),
  discount_percent: yup.number().min(0).max(100).nullable().optional(),
  sku: yup.string().min(1, 'SKU is required').required('SKU is required'),
  stock: yup.number().integer().min(0, 'Stock cannot be negative').default(0).required(),
  category_id: yup.string().min(1, 'Category is required').required('Category is required'),
  vendor_id: yup.string().nullable().optional(),
  variant_types: yup.array(variantTypeYupSchema).optional().default([]),
});
