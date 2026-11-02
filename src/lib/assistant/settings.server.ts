/**
 * The admin-managed side of the assistant: settings (on/off, model, look) and
 * knowledge entries. Read on every question, so cached for 30 seconds per
 * server instance; an admin save clears this instance's copy at once and the
 * others catch up within the TTL.
 */
import type { assistant_faqs, assistant_settings } from '@prisma/client';
import { prisma } from '@/lib';
import type { AssistantAppearance } from '@/types/models';

export const SETTINGS_ID = 'default';
const TTL_MS = 30_000;

/** What a missing settings row means: the schema defaults. */
export const DEFAULT_SETTINGS: assistant_settings = {
  id: SETTINGS_ID,
  enabled: true,
  model: null,
  extra_instructions: null,
  rate_limit: 20,
  button_label_ka: null,
  button_label_en: null,
  welcome_title_ka: null,
  welcome_title_en: null,
  welcome_text_ka: null,
  welcome_text_en: null,
  examples_ka: [],
  examples_en: [],
  button_color: null,
  button_position: 'right',
  show_on_mobile: true,
  updated_by: null,
  updated_at: new Date(0),
};

export interface AssistantConfig {
  settings: assistant_settings;
  /** Active knowledge entries, in display order. */
  faqs: assistant_faqs[];
}

let cache: { at: number; value: Promise<AssistantConfig> } | null = null;

async function load(): Promise<AssistantConfig> {
  try {
    const [settings, faqs] = await Promise.all([
      prisma.assistant_settings.findUnique({ where: { id: SETTINGS_ID } }),
      prisma.assistant_faqs.findMany({
        where: { is_active: true },
        orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
      }),
    ]);
    return { settings: settings ?? DEFAULT_SETTINGS, faqs };
  } catch (err) {
    // Settings must never take the assistant down (e.g. migration not applied
    // yet): run on the defaults and try again after the TTL.
    console.error('[assistant] settings load failed, using defaults', err);
    return { settings: DEFAULT_SETTINGS, faqs: [] };
  }
}

export function getAssistantConfig(): Promise<AssistantConfig> {
  if (!cache || Date.now() - cache.at >= TTL_MS) cache = { at: Date.now(), value: load() };
  return cache.value;
}

/** Call after an admin change so this instance serves it straight away. */
export function invalidateAssistantConfig() {
  cache = null;
}

/**
 * On only when a key is configured, the ASSISTANT_ENABLED env kill switch isn't
 * "false", and the admin switch is on.
 */
export function isAssistantEnabled(settings: assistant_settings) {
  return !!process.env.OPENROUTER_API_KEY && process.env.ASSISTANT_ENABLED !== 'false' && settings.enabled;
}

/** Why it's off, for the admin page. */
export function assistantEnvStatus() {
  return {
    has_api_key: !!process.env.OPENROUTER_API_KEY,
    env_disabled: process.env.ASSISTANT_ENABLED === 'false',
    env_model: process.env.ASSISTANT_MODEL || null,
  };
}

/** The settings the chat on the public site needs; nothing else leaves the server. */
export function publicAppearance(settings: assistant_settings): AssistantAppearance {
  return {
    button_label_ka: settings.button_label_ka,
    button_label_en: settings.button_label_en,
    welcome_title_ka: settings.welcome_title_ka,
    welcome_title_en: settings.welcome_title_en,
    welcome_text_ka: settings.welcome_text_ka,
    welcome_text_en: settings.welcome_text_en,
    examples_ka: settings.examples_ka,
    examples_en: settings.examples_en,
    button_color: settings.button_color,
    button_position: settings.button_position === 'left' ? 'left' : 'right',
    show_on_mobile: settings.show_on_mobile,
  };
}
