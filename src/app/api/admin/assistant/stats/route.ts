import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';

interface DayRow {
  day: Date;
  questions: number;
  cost_usd: number;
  avg_ms: number | null;
  helpful: number;
  not_helpful: number;
  errors: number;
  no_products: number;
  invented: number;
}

// GET /api/admin/assistant/stats?days=30 - Usage per day and totals over the period.
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const adminUser = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
      if (!adminUser || adminUser.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
      }

      const requested = parseInt(new URL(req.url).searchParams.get('days') || '30', 10);
      const days = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 365) : 30;

      // "No products" counts answered questions that showed nothing — stock gaps
      // or search gaps — not failures, which are counted as errors.
      const rows = await prisma.$queryRaw<DayRow[]>`
        SELECT date_trunc('day', created_at)::date AS day,
               count(*)::int AS questions,
               coalesce(sum(cost_usd), 0)::float8 AS cost_usd,
               avg(duration_ms)::float8 AS avg_ms,
               count(*) FILTER (WHERE helpful)::int AS helpful,
               count(*) FILTER (WHERE helpful = false)::int AS not_helpful,
               count(*) FILTER (WHERE error IS NOT NULL)::int AS errors,
               count(*) FILTER (WHERE error IS NULL AND cardinality(product_ids) = 0)::int AS no_products,
               coalesce(sum(invented), 0)::int AS invented
        FROM assistant_logs
        WHERE created_at >= now() - make_interval(days => ${days})
        GROUP BY 1
        ORDER BY 1 DESC`;

      const totals = rows.reduce(
        (acc, r) => ({
          questions: acc.questions + r.questions,
          cost_usd: acc.cost_usd + r.cost_usd,
          weighted_ms: acc.weighted_ms + (r.avg_ms ?? 0) * r.questions,
          helpful: acc.helpful + r.helpful,
          not_helpful: acc.not_helpful + r.not_helpful,
          errors: acc.errors + r.errors,
          no_products: acc.no_products + r.no_products,
          invented: acc.invented + r.invented,
        }),
        { questions: 0, cost_usd: 0, weighted_ms: 0, helpful: 0, not_helpful: 0, errors: 0, no_products: 0, invented: 0 }
      );
      const { weighted_ms, ...rest } = totals;

      return NextResponse.json({
        days,
        totals: { ...rest, avg_seconds: totals.questions ? weighted_ms / totals.questions / 1000 : null },
        daily: rows.map((r) => ({ ...r, day: r.day.toISOString().slice(0, 10) })),
      });
    } catch (error) {
      console.error('Get assistant stats error:', error);
      return NextResponse.json({ error: 'Failed to load statistics' }, { status: 500 });
    }
  });
}
