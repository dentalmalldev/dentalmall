import { z } from 'zod';

export const productVariantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Variant name is required'),
  name_ka: z.string().min(1, 'Georgian variant name is required'),
  price: z.number().positive('Price must be positive'),
  sale_price: z.number().positive('Sale price must be positive').optional().nullable(),
  discount_percent: z.number().min(0).max(100).optional().nullable(),
  stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
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
  variants: z.array(productVariantSchema).optional().default([]),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductFormValues = z.infer<typeof createProductSchema>;
export type UpdateProductFormValues = z.infer<typeof updateProductSchema>;
export type ProductVariantFormValues = z.infer<typeof productVariantSchema>;
