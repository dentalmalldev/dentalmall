import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib';

// PUT - Approve or reject a vendor request (admin only)
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

      // Get the vendor request
      const vendorRequest = await prisma.vendor_requests.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!vendorRequest) {
        return NextResponse.json(
          { error: 'Vendor request not found' },
          { status: 404 }
        );
      }

      if (vendorRequest.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'This request has already been processed' },
          { status: 400 }
        );
      }

      if (action === 'approve') {
        // Check if identification number is already used
        const existingVendor = await prisma.vendors.findUnique({
          where: { identification_number: vendorRequest.identification_number },
        });

        if (existingVendor) {
          return NextResponse.json(
            { error: 'A vendor with this identification number already exists' },
            { status: 400 }
          );
        }

        // Use transaction to create vendor, update user role, and update request
        await prisma.$transaction([
          // Create the vendor
          prisma.vendors.create({
            data: {
              user_id: vendorRequest.user_id,
              company_name: vendorRequest.company_name,
              identification_number: vendorRequest.identification_number,
              email: vendorRequest.email,
              description: vendorRequest.description,
              city: vendorRequest.city,
              address: vendorRequest.address,
              phone_number: vendorRequest.phone_number,
            },
          }),
          // Update user role to VENDOR
          prisma.users.update({
            where: { id: vendorRequest.user_id },
            data: { role: 'VENDOR' },
          }),
          // Update request status
          prisma.vendor_requests.update({
            where: { id },
            data: {
              status: 'APPROVED',
              admin_notes: admin_notes || null,
            },
          }),
        ]);

        return NextResponse.json({
          success: true,
          message: 'Vendor request approved successfully',
        });
      } else {
        // Reject the request
        await prisma.vendor_requests.update({
          where: { id },
          data: {
            status: 'REJECTED',
            admin_notes: admin_notes || null,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Vendor request rejected',
        });
      }
    } catch (error) {
      console.error('Error processing vendor request:', error);
      return NextResponse.json(
        { error: 'Failed to process vendor request' },
        { status: 500 }
      );
    }
  });
}
