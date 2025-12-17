import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './prisma';

export type UserRole = 'USER' | 'ADMIN';

export interface AuthorizedSession {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
  };
}

/**
 * Get the current session and ensure user is authenticated
 * @returns Session if authenticated, null otherwise
 */
export async function getAuthenticatedUser(): Promise<AuthorizedSession | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return null;
  }

  // Fetch user role if not in session
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    },
  };
}

/**
 * Check if user is authenticated
 * @throws Error if not authenticated
 */
export async function requireAuth(): Promise<AuthorizedSession> {
  const session = await getAuthenticatedUser();
  
  if (!session) {
    throw new Error('Unauthorized. Please log in.');
  }

  return session;
}

/**
 * Check if user is an admin
 * @throws Error if not admin
 */
export async function requireAdmin(): Promise<AuthorizedSession> {
  const session = await requireAuth();
  
  if (session.user.role !== 'ADMIN') {
    throw new Error('Forbidden. Admin access required.');
  }

  return session;
}

/**
 * Check if user is the owner of a resource or an admin
 * @param resourceUserId - The user ID of the resource owner
 * @returns true if user is owner or admin, false otherwise
 */
export async function canAccessResource(resourceUserId: string): Promise<boolean> {
  const session = await getAuthenticatedUser();
  
  if (!session) {
    return false;
  }

  // Admins can access everything
  if (session.user.role === 'ADMIN') {
    return true;
  }

  // Users can access their own resources
  return session.user.id === resourceUserId;
}

/**
 * Require that user is the owner of a resource or an admin
 * @param resourceUserId - The user ID of the resource owner
 * @throws Error if user is not owner or admin
 */
export async function requireOwnershipOrAdmin(resourceUserId: string): Promise<void> {
  const session = await requireAuth();
  
  // Admins can access everything
  if (session.user.role === 'ADMIN') {
    return;
  }

  // Check ownership
  if (session.user.id !== resourceUserId) {
    throw new Error('Forbidden. You can only access your own resources.');
  }
}

/**
 * Check if current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getAuthenticatedUser();
  return session?.user.role === 'ADMIN';
}

/**
 * Get user ID from session
 * @throws Error if not authenticated
 */
export async function getCurrentUserId(): Promise<string> {
  const session = await requireAuth();
  return session.user.id;
}

/**
 * Authorization response utilities for API routes
 */
export const AuthResponses = {
  unauthorized: () => ({
    error: 'Unauthorized. Please log in.',
    status: 401,
  }),
  
  forbidden: (message?: string) => ({
    error: message || 'Forbidden. You do not have permission to access this resource.',
    status: 403,
  }),
  
  notFound: (resource: string = 'Resource') => ({
    error: `${resource} not found`,
    status: 404,
  }),
  
  adminOnly: () => ({
    error: 'Forbidden. Admin access required.',
    status: 403,
  }),
  
  ownerOnly: () => ({
    error: 'Forbidden. You can only access your own resources.',
    status: 403,
  }),
};
