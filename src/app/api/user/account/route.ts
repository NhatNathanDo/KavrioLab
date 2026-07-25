import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      isGoogleAccount: !user.passwordHash,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Error fetching account details:', error);
    return NextResponse.json({ error: 'Failed to fetch account details' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { name, email, currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updates: { name?: string; email?: string; passwordHash?: string } = {};

    // 1. Name update
    if (name && typeof name === 'string' && name.trim().length >= 2) {
      updates.name = name.trim();
    }

    // Check if security-sensitive fields (email or password) are being updated
    const isUpdatingEmail = email && typeof email === 'string' && email.trim().toLowerCase() !== user.email.toLowerCase();
    const isUpdatingPassword = newPassword && typeof newPassword === 'string' && newPassword.length >= 6;

    if (isUpdatingEmail || isUpdatingPassword) {
      // If account has a passwordHash, require currentPassword verification
      if (user.passwordHash) {
        if (!currentPassword) {
          return NextResponse.json(
            { error: 'Current password is required to make security changes' },
            { status: 400 }
          );
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
          return NextResponse.json(
            { error: 'Current password is incorrect' },
            { status: 400 }
          );
        }
      }

      // Handle Email Update
      if (isUpdatingEmail) {
        const normalizedEmail = email.trim().toLowerCase();
        const existingEmailUser = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (existingEmailUser && existingEmailUser.id !== userId) {
          return NextResponse.json(
            { error: 'This email address is already in use by another account' },
            { status: 400 }
          );
        }
        updates.email = normalizedEmail;
      }

      // Handle Password Update
      if (isUpdatingPassword) {
        updates.passwordHash = await bcrypt.hash(newPassword, 10);
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'No changes were provided' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        isGoogleAccount: !updatedUser.passwordHash,
      },
    });
  } catch (error) {
    console.error('Error updating account details:', error);
    return NextResponse.json({ error: 'Failed to update account details' }, { status: 500 });
  }
}
