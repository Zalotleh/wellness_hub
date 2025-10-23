import NextAuth from 'next-auth';
import { AuthOptions } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Create auth handler with proper typing
const handler = NextAuth(authOptions as AuthOptions);

// Export GET and POST handlers for API routes
export { handler as GET, handler as POST };

// Explicitly disable static generation for auth routes
export const dynamic = 'force-dynamic';