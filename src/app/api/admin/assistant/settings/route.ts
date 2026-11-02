import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';
import { logAdminAction } from '@/lib/admin-log';
import { DEFAULT_MODEL } from '@/lib/assistant/agent';
import {
  assistantEnvStatus,
  DEFAULT_SETTINGS,
  invalidateAssistantConfig,
  isAssistantEnabled,
  SETTINGS_ID,
} from '@/lib/assistant/settings.server';
import { assistantSettingsSchema } from '@/lib/validations/assistant';

/** True/false when OpenRouter's public model list answered, null when it couldn't be reached. */
async function modelExists(id: string): Promise<boolean | null> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const body: { data?: Array<{ id: string }> } = await res.json();
    return (body.data ?? []).some((m) => m.id === id);
  } catch {
    return null;
  }
}

async function settingsResponse() {
  const row = (await prisma.assistant_settings.findUnique({ where: { id: SETTINGS_ID } })) ?? DEFAULT_SETTINGS;
  return {
    settings: row,
    env: assistantEnvStatus(),
    /** What the assistant actually runs with right now. */
    effective: {
      enabled: isAssistantEnabled(row),
      model: row.model || process.env.ASSISTANT_MODEL || DEFAULT_MODEL,
    },
    default_model: DEFAULT_MODEL,
  };
}

// GET /api/admin/assistant/settings - Current settings, plus what the env vars do to them.
export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, authUser) => {
    try {
      const adminUser = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
      if (!adminUser || adminUser.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
      }

      return NextResponse.json(await settingsResponse());
    } catch (error) {
      console.error('Get assistant settings error:', error);
      return NextResponse.json({ error: 'Failed to load assistant settings' }, { status: 500 });
    }
  });
}

// PUT /api/admin/assistant/settings - Save any subset of the settings.
export async function PUT(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const adminUser = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
      if (!adminUser || adminUser.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
      }

      const parsed = assistantSettingsSchema.safeParse(await req.json().catch(() => null));
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? 'Invalid settings', issues: parsed.error.issues },
          { status: 400 }
        );
      }
      const data = parsed.data;

      // A mistyped model id would break every answer, so check it before saving.
      // If OpenRouter can't be reached the save goes ahead.
      if (data.model) {
        const current = await prisma.assistant_settings.findUnique({ where: { id: SETTINGS_ID } });
        if (data.model !== current?.model && (await modelExists(data.model)) === false) {
          return NextResponse.json(
            { error: `Model "${data.model}" was not found on OpenRouter`, code: 'UNKNOWN_MODEL' },
            { status: 400 }
          );
        }
      }

      await prisma.assistant_settings.upsert({
        where: { id: SETTINGS_ID },
        create: { id: SETTINGS_ID, ...data, updated_by: adminUser.id },
        update: { ...data, updated_by: adminUser.id },
      });
      invalidateAssistantConfig();

      await logAdminAction(
        adminUser.id,
        'ASSISTANT_SETTINGS_UPDATED',
        undefined,
        `Changed: ${Object.keys(data).join(', ')}${data.enabled !== undefined ? ` (enabled → ${data.enabled})` : ''}`
      );

      return NextResponse.json(await settingsResponse());
    } catch (error) {
      console.error('Update assistant settings error:', error);
      return NextResponse.json({ error: 'Failed to save assistant settings' }, { status: 500 });
    }
  });
}
