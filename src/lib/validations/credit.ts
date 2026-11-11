import { z } from 'zod';
import { hasAtMostTwoDecimals, MAX_CREDIT_CHANGE } from '@/lib/credit/money';

/**
 * An admin's change to a user's credit. `amount` is what is added or
 * subtracted, or the new balance for SET; at most 10,000 ₾ either way. Error
 * messages are codes the admin UI translates.
 */
export const creditChangeZodSchema = z
  .object({
    type: z.enum(['ADD', 'SUBTRACT', 'SET']),
    amount: z
      .number()
      .min(0, 'amount_range')
      .max(MAX_CREDIT_CHANGE, 'amount_range')
      .refine(hasAtMostTwoDecimals, 'amount_decimals'),
    note: z.string().trim().min(1, 'note_required').max(500, 'note_too_long'),
  })
  .refine((change) => change.type === 'SET' || change.amount > 0, {
    message: 'amount_range',
    path: ['amount'],
  });

export type CreditChangeInput = z.infer<typeof creditChangeZodSchema>;
