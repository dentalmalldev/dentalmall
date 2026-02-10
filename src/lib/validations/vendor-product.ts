import { z } from 'zod';

export const vendorUpdateProductPricingSchema = z.object({
  price: z.number().positive('Price must be positive').optional(),
  sale_price: z.number().positive('Sale price must be positive').optional().nullable(),
  discount_percent: z.number().min(0).max(100).optional().nullable(),
  variant_options: z
    .array(
      z.object({
        id: z.string().min(1),
        price: z.number().positive('Price must be positive').optional(),
        sale_price: z.number().positive('Sale price must be positive').optional().nullable(),
        discount_percent: z.number().min(0).max(100).optional().nullable(),
      })
    )
    .optional(),
});

export type VendorUpdateProductPricingValues = z.infer<typeof vendorUpdateProductPricingSchema>;
