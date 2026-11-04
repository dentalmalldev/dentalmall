import { z } from 'zod';

// Optional text: blank means "use the default wording", stored as null.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v ? v : null));

const examples = z.array(z.string().trim().min(1).max(80)).max(4);

// Admin edits to the AI assistant's settings (PUT /api/admin/assistant/settings).
// Every field is optional so a section can be saved on its own.
export const assistantSettingsSchema = z
  .object({
    enabled: z.boolean(),
    model: optionalText(120),
    extra_instructions: optionalText(2000),
    rate_limit: z.number().int().min(1).max(200),
    button_label_ka: optionalText(40),
    button_label_en: optionalText(40),
    welcome_title_ka: optionalText(80),
    welcome_title_en: optionalText(80),
    welcome_text_ka: optionalText(300),
    welcome_text_en: optionalText(300),
    examples_ka: examples,
    examples_en: examples,
    button_color: z
      .string()
      .trim()
      .regex(/^#[0-9a-fA-F]{6}$/, 'Colour must look like #5B6ECD')
      .nullable()
      .optional(),
    button_position: z.enum(['right', 'left']),
    show_on_mobile: z.boolean(),
  })
  .partial();

export type AssistantSettingsValues = z.infer<typeof assistantSettingsSchema>;

// One knowledge entry (POST / PATCH /api/admin/assistant/faqs).
export const assistantFaqSchema = z.object({
  question_ka: z.string().trim().min(1).max(300),
  question_en: z.string().trim().min(1).max(300),
  answer_ka: z.string().trim().min(1).max(2000),
  answer_en: z.string().trim().min(1).max(2000),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(10_000).optional(),
});

export const assistantFaqUpdateSchema = assistantFaqSchema.partial();

export type AssistantFaqValues = z.infer<typeof assistantFaqSchema>;
