import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get user's measurement preference
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      // Return default for non-authenticated users
      return NextResponse.json({
        system: 'imperial',
        temperature: 'fahrenheit',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { measurementSystem: true } as any,
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return the user's preference
    const system = (user as any).measurementSystem as 'imperial' | 'metric';
    return NextResponse.json({
      system,
      temperature: system === 'imperial' ? 'fahrenheit' : 'celsius',
    });
  } catch (error) {
    console.error('Error fetching measurement preference:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preference' },
      { status: 500 }
    );
  }
}

// PUT - Update user's measurement preference
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { system } = body;

    // Validate system
    if (!system || !['imperial', 'metric'].includes(system)) {
      return NextResponse.json(
        { error: 'Invalid measurement system. Must be "imperial" or "metric".' },
        { status: 400 }
      );
    }

    // Update user's preference in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { measurementSystem: system } as any,
      select: { measurementSystem: true } as any,
    });

    return NextResponse.json({
      success: true,
      system: (updatedUser as any).measurementSystem,
      temperature: system === 'imperial' ? 'fahrenheit' : 'celsius',
    });
  } catch (error) {
    console.error('Error updating measurement preference:', error);
    return NextResponse.json(
      { error: 'Failed to update preference' },
      { status: 500 }
    );
  }
}
