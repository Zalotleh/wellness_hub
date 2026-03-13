import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
  subscriptionTier: z.enum(['FREE', 'PREMIUM', 'FAMILY']).default('FREE'),
});

/**
 * GET /api/admin/users
 * List all users with optional search and pagination (Admin only)
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search') || '';

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          createdAt: true,
          lastLoginAt: true,
          anonymized: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, limit });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    if (msg.includes('Forbidden') || msg.includes('Unauthorized')) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    console.error('Error listing users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Create a new user (Admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const adminSession = await requireAdmin();
    const body = await req.json();

    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, email, password, role, subscriptionTier } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role, subscriptionTier },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subscriptionTier: true,
        createdAt: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: adminSession.user.id,
        targetUserId: user.id,
        action: 'USER_CREATED',
        details: { email: user.email, role: user.role, subscriptionTier: user.subscriptionTier },
      },
    }).catch(() => {});

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    if (msg.includes('Forbidden') || msg.includes('Unauthorized')) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
