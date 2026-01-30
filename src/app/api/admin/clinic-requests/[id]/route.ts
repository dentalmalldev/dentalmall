import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib';

// PUT - Approve or reject a clinic request (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, authUser) => {
    try {
      const { id } = await params;

      // Verify admin role
      const adminUser = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!adminUser || adminUser.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Access denied. Admin privileges required.' },
          { status: 403 }
        );
      }

      const body = await req.json();
      const { action, admin_notes } = body;

      if (!action || !['approve', 'reject'].includes(action)) {
        return NextResponse.json(
          { error: 'Invalid action. Must be "approve" or "reject".' },
          { status: 400 }
        );
      }

      // Get the clinic request
      const clinicRequest = await prisma.clinic_requests.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!clinicRequest) {
        return NextResponse.json(
          { error: 'Clinic request not found' },
          { status: 404 }
        );
      }

      if (clinicRequest.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'This request has already been processed' },
          { status: 400 }
        );
      }

      if (action === 'approve') {
        // Check if identification number is already used
        const existingClinic = await prisma.clinics.findUnique({
          where: { identification_number: clinicRequest.identification_number },
        });

        if (existingClinic) {
          return NextResponse.json(
            { error: 'A clinic with this identification number already exists' },
            { status: 400 }
          );
        }

        // Use transaction to create clinic, update user role, and update request
        await prisma.$transaction([
          // Create the clinic
          prisma.clinics.create({
            data: {
              user_id: clinicRequest.user_id,
              clinic_name: clinicRequest.clinic_name,
              identification_number: clinicRequest.identification_number,
              email: clinicRequest.email,
              description: clinicRequest.description,
              city: clinicRequest.city,
              address: clinicRequest.address,
              phone_number: clinicRequest.phone_number,
            },
          }),
          // Update user role to CLINIC
          prisma.users.update({
            where: { id: clinicRequest.user_id },
            data: { role: 'CLINIC' },
          }),
          // Update request status
          prisma.clinic_requests.update({
            where: { id },
            data: {
              status: 'APPROVED',
              admin_notes: admin_notes || null,
            },
          }),
        ]);

        return NextResponse.json({
          success: true,
          message: 'Clinic request approved successfully',
        });
      } else {
        // Reject the request
        await prisma.clinic_requests.update({
          where: { id },
          data: {
            status: 'REJECTED',
            admin_notes: admin_notes || null,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Clinic request rejected',
        });
      }
    } catch (error) {
      console.error('Error processing clinic request:', error);
      return NextResponse.json(
        { error: 'Failed to process clinic request' },
        { status: 500 }
      );
    }
  });
}
