import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/audit-logs
 * Fetch audit logs (Admin only)
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const action = searchParams.get('action') || '';
    const userId = searchParams.get('userId') || '';

    const where: { action?: string; userId?: string } = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total, page, limit });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    if (msg.includes('Forbidden') || msg.includes('Unauthorized')) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
