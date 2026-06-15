import { z } from 'zod';

// How text/image fields are applied across the selection.
export const applyModeSchema = z.enum(['replace', 'fill_empty']);

// A text field update carries its value + apply mode.
const textFieldSchema = z.object({
  value: z.string(),
  mode: applyModeSchema,
});

// Image to apply to the selection (already uploaded via /api/upload).
const imageFieldSchema = z.object({
  url: z.string().min(1),
  filename: z.string().min(1),
  original_name: z.string().min(1),
  size: z.number().int().nullable().optional(),
  mode: applyModeSchema,
});

// Stock can be set to an absolute value or adjusted by a delta.
const stockFieldSchema = z.object({
  mode: z.enum(['set', 'delta']),
  value: z.number().int(),
});

// Only the fields the admin ticked "Update this field" are present.
export const bulkEditFieldsSchema = z
  .object({
    price: z.number().nonnegative().optional(),
    sale_price: z.number().nonnegative().nullable().optional(),
    manufacturer: z.string().optional(),
    // Final category id (a subcategory id when a subcategory was chosen).
    category_id: z.string().min(1).optional(),
    vendor_id: z.string().nullable().optional(),
    in_storage_stock: z.boolean().optional(),
    stock: stockFieldSchema.optional(),
    description: textFieldSchema.optional(),
    description_ka: textFieldSchema.optional(),
    image: imageFieldSchema.optional(),
  })
  .refine((f) => Object.keys(f).length > 0, {
    message: 'At least one field must be selected for update',
  });

// Target: either an explicit id list, or "everything matching the active filters".
export const bulkTargetSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('ids'), ids: z.array(z.string().min(1)).min(1) }),
  z.object({ mode: z.literal('filters'), filters: z.record(z.string(), z.string()) }),
]);

export const bulkEditSchema = z.object({
  target: bulkTargetSchema,
  fields: bulkEditFieldsSchema,
});

export const bulkDeleteSchema = z.object({
  target: bulkTargetSchema,
});

export type BulkEditFields = z.infer<typeof bulkEditFieldsSchema>;
export type BulkTarget = z.infer<typeof bulkTargetSchema>;
export type BulkEditBody = z.infer<typeof bulkEditSchema>;
export type BulkDeleteBody = z.infer<typeof bulkDeleteSchema>;
