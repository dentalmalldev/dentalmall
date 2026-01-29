import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib';

interface RegisterRequestBody {
  firebase_uid: string;
  email: string;
  first_name: string;
  last_name: string;
  personal_id?: string;
  auth_provider: 'EMAIL' | 'GOOGLE';
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequestBody = await request.json();
    const { firebase_uid, email, first_name, last_name, personal_id, auth_provider } = body;

    // Validate required fields
    if (!firebase_uid || !email || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    // For email registration, personal_id is required
    if (auth_provider === 'EMAIL' && !personal_id) {
      return NextResponse.json(
        { error: 'Personal ID is required for email registration' },
        { status: 400 }
      );
    }

    // Check if user already exists by firebase_uid or email
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          { firebase_uid },
          { email },
        ],
      },
    });

    if (existingUser) {
      // If user exists, return the existing user (for Google sign-in)
      if (auth_provider === 'GOOGLE') {
        return NextResponse.json({
          id: existingUser.id,
          email: existingUser.email,
          first_name: existingUser.first_name,
          last_name: existingUser.last_name,
          auth_provider: existingUser.auth_provider,
          created_at: existingUser.created_at,
        });
      }
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Check if personal_id is already taken (only if provided)
    if (personal_id) {
      const existingPersonalId = await prisma.users.findUnique({
        where: { personal_id },
      });

      if (existingPersonalId) {
        return NextResponse.json(
          { error: 'Personal ID already exists' },
          { status: 409 }
        );
      }
    }

    // Create new user
    const user = await prisma.users.create({
      data: {
        firebase_uid,
        email,
        first_name,
        last_name,
        personal_id: personal_id || null,
        auth_provider: auth_provider || 'EMAIL',
      },
    });

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        auth_provider: user.auth_provider,
        created_at: user.created_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
