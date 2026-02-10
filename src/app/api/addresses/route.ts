import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib';
import { addressZodSchema } from '@/lib/validations/address';

// GET - Get user's addresses
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const addresses = await prisma.addresses.findMany({
        where: { user_id: user.id },
        orderBy: [
          { is_default: 'desc' },
          { created_at: 'desc' },
        ],
      });

      return NextResponse.json(addresses);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch addresses' },
        { status: 500 }
      );
    }
  });
}

// POST - Create a new address
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const body = await request.json();
      const validationResult = addressZodSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationResult.error },
          { status: 400 }
        );
      }

      const { city, address, is_default } = validationResult.data;

      // If this address is set as default, unset other defaults
      if (is_default) {
        await prisma.addresses.updateMany({
          where: { user_id: user.id, is_default: true },
          data: { is_default: false },
        });
      }

      // Check if user has any addresses, if not make this the default
      const existingAddresses = await prisma.addresses.count({
        where: { user_id: user.id },
      });

      const newAddress = await prisma.addresses.create({
        data: {
          user_id: user.id,
          city,
          address,
          is_default: is_default || existingAddresses === 0,
        },
      });

      return NextResponse.json(newAddress, { status: 201 });
    } catch (error) {
      console.error('Error creating address:', error);
      return NextResponse.json(
        { error: 'Failed to create address' },
        { status: 500 }
      );
    }
  });
}
