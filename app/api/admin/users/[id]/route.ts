import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  subscriptionTier: z.enum(['FREE', 'PREMIUM', 'FAMILY']).optional(),
});

/**
 * PATCH /api/admin/users/[id]
 * Update a user (Admin only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminSession = await requireAdmin();
    const body = await req.json();

    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, password, role, subscriptionTier } = parsed.data;
    const email = parsed.data.email?.toLowerCase().trim();

    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (email && email !== target.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (subscriptionTier !== undefined) updateData.subscriptionTier = subscriptionTier;
    if (password !== undefined) updateData.password = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subscriptionTier: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    // Audit log
    const changedFields = Object.keys(updateData).filter((k) => k !== 'password');
    await prisma.auditLog.create({
      data: {
        userId: adminSession.user.id,
        targetUserId: user.id,
        action: 'USER_UPDATED',
        details: { changedFields, email: user.email },
      },
    }).catch(() => {});

    return NextResponse.json({ user });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    if (msg.includes('Forbidden') || msg.includes('Unauthorized')) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user and all their data (Admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminSession = await requireAdmin();

    // Prevent admin from deleting themselves
    if (params.id === adminSession.user.id) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, name: true },
    });
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create audit log BEFORE deletion (cascade will delete relations)
    await prisma.auditLog.create({
      data: {
        userId: adminSession.user.id,
        targetUserId: null, // will be gone after delete
        action: 'USER_DELETED',
        details: { deletedUserId: target.id, deletedEmail: target.email, deletedName: target.name },
      },
    }).catch(() => {});

    // Record in GDPR DeletionLog
    await prisma.deletionLog.create({
      data: {
        userId: target.id,
        email: target.email.replace(/(.{2}).*@/, '$1***@'),
        reason: 'Deleted by admin',
      },
    }).catch(() => {});

    await prisma.user.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    if (msg.includes('Forbidden') || msg.includes('Unauthorized')) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
