import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Simple feature check without requiring the full feature flags system
const hasFeatureAccess = (user: any) => {
  // For now, allow all users to use pantry management
  return true;
};

// GET - Fetch all pantry items for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check feature access
    if (!hasFeatureAccess(user)) {
      return NextResponse.json(
        {
          error: 'Pantry management requires Premium',
          upgrade: true,
        },
        { status: 403 }
      );
    }

    // For now, return empty pantry items since the model doesn't exist yet
    const pantryItems: any[] = [];

    return NextResponse.json({
      items: pantryItems,
      stats: {
        total: 0,
        lowStock: 0,
        expiring: 0,
        alwaysHave: 0,
      },
      alerts: {
        lowStock: [],
        expiring: [],
      },
    });
  } catch (error) {
    console.error('Error fetching pantry items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pantry items' },
      { status: 500 }
    );
  }
}

// POST - Add new pantry item
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      category,
      currentStock,
      unit,
      minimumStock = 0,
      alwaysHave = false,
      expiryDate,
      cost,
      location,
      notes,
    } = body;

    // Validate required fields
    if (!name || !category || currentStock === undefined || !unit) {
      return NextResponse.json(
        { error: 'Name, category, current stock, and unit are required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check feature access
    if (!hasFeatureAccess(user)) {
      return NextResponse.json(
        {
          error: 'Pantry management requires Premium',
          upgrade: true,
        },
        { status: 403 }
      );
    }

    // For now, return a mock pantry item since the model doesn't exist yet
    const mockPantryItem = {
      id: `pantry-${Date.now()}`,
      userId: session.user.id,
      name: name.trim(),
      category,
      currentStock: parseFloat(currentStock),
      unit: unit.trim(),
      minimumStock: parseFloat(minimumStock),
      alwaysHave,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      cost: cost ? parseFloat(cost) : null,
      location: location?.trim() || null,
      notes: notes?.trim() || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json({
      item: mockPantryItem,
      message: 'Pantry item added successfully (mock response)',
    });
  } catch (error) {
    console.error('Error adding pantry item:', error);
    return NextResponse.json(
      { error: 'Failed to add pantry item' },
      { status: 500 }
    );
  }
}

// PUT - Bulk update pantry items (for inventory management)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { updates } = body; // Array of { id, updates }

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Updates must be an array' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check feature access
    if (!hasFeatureAccess(user)) {
      return NextResponse.json(
        {
          error: 'Pantry management requires Premium',
          upgrade: true,
        },
        { status: 403 }
      );
    }

    // For now, return mock updated items
    const updatedItems = updates.map((update: any) => ({
      id: update.id,
      ...update.updates,
      updatedAt: new Date(),
    }));

    return NextResponse.json({
      items: updatedItems,
      message: 'Pantry items updated successfully (mock response)',
    });
  } catch (error) {
    console.error('Error updating pantry items:', error);
    return NextResponse.json(
      { error: 'Failed to update pantry items' },
      { status: 500 }
    );
  }
}