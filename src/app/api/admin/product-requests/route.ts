import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma, withAuth } from '@/lib';
import { adminProductRequestFilterZodSchema } from '@/lib/validations/product-request';

// GET - Requested products for the admin table and its Excel export
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const adminUser = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!adminUser || adminUser.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Access denied. Admin privileges required.' },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(req.url);
      const validationResult = adminProductRequestFilterZodSchema.safeParse(
        Object.fromEntries(searchParams)
      );

      if (!validationResult.success) {
        return NextResponse.json({ error: 'Invalid filters' }, { status: 400 });
      }

      const { page, limit, search, status, date_from, date_to } = validationResult.data;

      const where: Prisma.product_request_itemsWhereInput = {};

      if (status) {
        where.status = status;
      }

      if (date_from || date_to) {
        where.created_at = {
          ...(date_from ? { gte: new Date(date_from) } : {}),
          ...(date_to ? { lte: new Date(date_to) } : {}),
        };
      }

      // Every word has to match something, so "Giorgi Beridze" finds first + last name.
      if (search) {
        where.AND = search.split(/\s+/).map((word) => ({
          request: {
            user: {
              OR: [
                { first_name: { contains: word, mode: 'insensitive' as const } },
                { last_name: { contains: word, mode: 'insensitive' as const } },
                { email: { contains: word, mode: 'insensitive' as const } },
                { phone_number: { contains: word } },
              ],
            },
          },
        }));
      }

      const [data, total] = await Promise.all([
        prisma.product_request_items.findMany({
          where,
          include: {
            request: {
              select: {
                user: {
                  select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                    phone_number: true,
                  },
                },
              },
            },
          },
          orderBy: [{ created_at: 'desc' }, { id: 'asc' }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.product_request_items.count({ where }),
      ]);

      return NextResponse.json({
        data,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error('Error fetching product requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch product requests' },
        { status: 500 }
      );
    }
  });
}
