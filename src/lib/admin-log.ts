import { prisma } from '@/lib/prisma';

export async function logAdminAction(
  adminId: string,
  action: string,
  targetUserId?: string,
  details?: string
) {
  try {
    await prisma.admin_action_logs.create({
      data: { admin_id: adminId, action, target_user_id: targetUserId || null, details: details || null },
    });
  } catch {
    // Non-critical — don't throw
  }
}
