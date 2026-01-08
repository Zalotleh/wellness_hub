import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/user/consent
 * Retrieve current user consent preferences
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const consent = await prisma.userConsent.findUnique({
      where: { userId: session.user.id },
      select: {
        necessary: true,
        analytics: true,
        marketing: true,
        consentDate: true,
        updatedAt: true,
      },
    });

    // If no consent record exists, create one with defaults
    if (!consent) {
      const newConsent = await prisma.userConsent.create({
        data: {
          userId: session.user.id,
          necessary: true,
          analytics: false,
          marketing: false,
        },
        select: {
          necessary: true,
          analytics: true,
          marketing: true,
          consentDate: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({ consent: newConsent });
    }

    return NextResponse.json({ consent });
  } catch (error) {
    console.error('Error fetching consent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consent preferences' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/consent
 * Update user consent preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { consentType, granted } = body;

    // Validate consent type
    const validTypes = ['analytics', 'marketing'];
    if (!validTypes.includes(consentType)) {
      return NextResponse.json(
        { error: 'Invalid consent type. Must be "analytics" or "marketing"' },
        { status: 400 }
      );
    }

    if (typeof granted !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid value. "granted" must be a boolean' },
        { status: 400 }
      );
    }

    // Get client info for GDPR tracking
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Update or create consent
    const consent = await prisma.userConsent.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        necessary: true, // Always true
        analytics: consentType === 'analytics' ? granted : false,
        marketing: consentType === 'marketing' ? granted : false,
        ipAddress,
        userAgent,
      },
      update: {
        [consentType]: granted,
        ipAddress,
        userAgent,
        updatedAt: new Date(),
      },
      select: {
        necessary: true,
        analytics: true,
        marketing: true,
        consentDate: true,
        updatedAt: true,
      },
    });

    // Log consent change for audit trail
    console.log(`[CONSENT] User ${session.user.id} ${granted ? 'granted' : 'revoked'} ${consentType} consent`);

    return NextResponse.json({ 
      success: true, 
      consent,
      message: `${consentType} consent ${granted ? 'granted' : 'revoked'} successfully` 
    });
  } catch (error) {
    console.error('Error updating consent:', error);
    return NextResponse.json(
      { error: 'Failed to update consent preferences' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/consent
 * Batch update multiple consent preferences
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { analytics, marketing } = body;

    // Validate inputs
    if (typeof analytics !== 'boolean' || typeof marketing !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid values. Both "analytics" and "marketing" must be booleans' },
        { status: 400 }
      );
    }

    // Get client info for GDPR tracking
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Update or create consent
    const consent = await prisma.userConsent.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        necessary: true,
        analytics,
        marketing,
        ipAddress,
        userAgent,
      },
      update: {
        analytics,
        marketing,
        ipAddress,
        userAgent,
        updatedAt: new Date(),
      },
      select: {
        necessary: true,
        analytics: true,
        marketing: true,
        consentDate: true,
        updatedAt: true,
      },
    });

    // Log consent change for audit trail
    console.log(`[CONSENT] User ${session.user.id} updated consents - Analytics: ${analytics}, Marketing: ${marketing}`);

    return NextResponse.json({ 
      success: true, 
      consent,
      message: 'Consent preferences updated successfully' 
    });
  } catch (error) {
    console.error('Error updating consents:', error);
    return NextResponse.json(
      { error: 'Failed to update consent preferences' },
      { status: 500 }
    );
  }
}
