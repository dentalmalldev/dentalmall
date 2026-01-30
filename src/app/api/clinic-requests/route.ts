import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib';

// GET - Get user's clinic requests
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const requests = await prisma.clinic_requests.findMany({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
      });

      return NextResponse.json(requests);
    } catch (error) {
      console.error('Error fetching clinic requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch clinic requests' },
        { status: 500 }
      );
    }
  });
}

// POST - Submit a new clinic request
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Check if user already has a pending request
      const existingPendingRequest = await prisma.clinic_requests.findFirst({
        where: {
          user_id: user.id,
          status: 'PENDING',
        },
      });

      if (existingPendingRequest) {
        return NextResponse.json(
          { error: 'You already have a pending clinic request' },
          { status: 400 }
        );
      }

      const body = await req.json();
      const {
        clinic_name,
        identification_number,
        email,
        description,
        city,
        address,
        phone_number,
      } = body;

      // Validate required fields
      if (!clinic_name || !identification_number || !email || !city || !address || !phone_number) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Check if identification number is already used
      const existingClinic = await prisma.clinics.findUnique({
        where: { identification_number },
      });

      if (existingClinic) {
        return NextResponse.json(
          { error: 'A clinic with this identification number already exists' },
          { status: 400 }
        );
      }

      const clinicRequest = await prisma.clinic_requests.create({
        data: {
          user_id: user.id,
          clinic_name,
          identification_number,
          email,
          description: description || null,
          city,
          address,
          phone_number,
        },
      });

      return NextResponse.json(clinicRequest, { status: 201 });
    } catch (error) {
      console.error('Error creating clinic request:', error);
      return NextResponse.json(
        { error: 'Failed to create clinic request' },
        { status: 500 }
      );
    }
  });
}
