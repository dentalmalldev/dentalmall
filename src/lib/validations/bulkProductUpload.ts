import { z } from 'zod';

/**
 * The wire format for the commit endpoint: the client posts back the
 * preview-validated rows (with resolved category/vendor IDs) plus a mode flag.
 */

export const bulkVariantOptionSchema = z.object({
  name_en: z.string().min(1, 'Variant option name (EN) is required'),
  name_ka: z.string(),
  dentalmall_price: z.number().positive('DentalMall price must be positive'),
  sku: z.string().nullable(),
  quantity: z.number().int().min(0).nullable(),
});

export const bulkProductRowSchema = z.object({
  rowNumber: z.number().int().min(1),
  name_en: z.string().min(1, 'Product name (EN) is required'),
  name_ka: z.string(),
  description_en: z.string().min(1, 'Description (EN) is required'),
  description_ka: z.string(),
  manufacturer: z.string().nullable(),
  sku: z.string().nullable(),
  price: z.number().positive('Price must be positive').nullable(),
  dentalmall_price: z.number().positive().nullable(),
  unit: z.string().nullable(),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  // Auto-derived from quantity during parsing; falls back to quantity > 0 at commit time.
  in_storage_stock: z.boolean().optional(),
  category_id: z.string().min(1, 'Category must resolve to a real record'),
  subcategory_id: z.string().nullable(),
  vendor_id: z.string().nullable(),
  variant_type_en: z.string().nullable(),
  variant_type_ka: z.string().nullable(),
  variant_options: z.array(bulkVariantOptionSchema),
});

export const bulkCommitSchema = z.object({
  rows: z.array(bulkProductRowSchema).min(1, 'No rows to commit'),
  mode: z.enum(['skip-invalid', 'abort-on-error']),
});

export type BulkVariantOption = z.infer<typeof bulkVariantOptionSchema>;
export type BulkProductRow = z.infer<typeof bulkProductRowSchema>;
export type BulkCommitBody = z.infer<typeof bulkCommitSchema>;
