import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib';
import { addressSchema } from '@/lib/validations/address';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get a specific address
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req, authUser) => {
    try {
      const { id } = await params;

      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const address = await prisma.addresses.findFirst({
        where: { id, user_id: user.id },
      });

      if (!address) {
        return NextResponse.json({ error: 'Address not found' }, { status: 404 });
      }

      return NextResponse.json(address);
    } catch (error) {
      console.error('Error fetching address:', error);
      return NextResponse.json(
        { error: 'Failed to fetch address' },
        { status: 500 }
      );
    }
  });
}

// PUT - Update an address
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req, authUser) => {
    try {
      const { id } = await params;

      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const existingAddress = await prisma.addresses.findFirst({
        where: { id, user_id: user.id },
      });

      if (!existingAddress) {
        return NextResponse.json({ error: 'Address not found' }, { status: 404 });
      }

      const body = await request.json();
      const validationResult = addressSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationResult.error.errors },
          { status: 400 }
        );
      }

      const { city, address, is_default } = validationResult.data;

      // If this address is set as default, unset other defaults
      if (is_default && !existingAddress.is_default) {
        await prisma.addresses.updateMany({
          where: { user_id: user.id, is_default: true },
          data: { is_default: false },
        });
      }

      const updatedAddress = await prisma.addresses.update({
        where: { id },
        data: {
          city,
          address,
          is_default: is_default ?? existingAddress.is_default,
        },
      });

      return NextResponse.json(updatedAddress);
    } catch (error) {
      console.error('Error updating address:', error);
      return NextResponse.json(
        { error: 'Failed to update address' },
        { status: 500 }
      );
    }
  });
}

// DELETE - Delete an address
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req, authUser) => {
    try {
      const { id } = await params;

      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const existingAddress = await prisma.addresses.findFirst({
        where: { id, user_id: user.id },
      });

      if (!existingAddress) {
        return NextResponse.json({ error: 'Address not found' }, { status: 404 });
      }

      await prisma.addresses.delete({
        where: { id },
      });

      // If deleted address was default, set another one as default
      if (existingAddress.is_default) {
        const firstAddress = await prisma.addresses.findFirst({
          where: { user_id: user.id },
          orderBy: { created_at: 'desc' },
        });

        if (firstAddress) {
          await prisma.addresses.update({
            where: { id: firstAddress.id },
            data: { is_default: true },
          });
        }
      }

      return NextResponse.json({ message: 'Address deleted successfully' });
    } catch (error) {
      console.error('Error deleting address:', error);
      return NextResponse.json(
        { error: 'Failed to delete address' },
        { status: 500 }
      );
    }
  });
}
