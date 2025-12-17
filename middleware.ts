import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Allow the request to continue
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Public paths that don't require authentication
        const publicPaths = [
          '/',
          '/auth/login',
          '/auth/signup',
          '/auth/forgot-password',
          '/auth/error',
          '/terms',
          '/privacy',
          '/api/auth',
        ];
        
        // Check if the path is public
        const isPublicPath = publicPaths.some(path => 
          pathname === path || pathname.startsWith(path)
        );
        
        // Allow access to public paths
        if (isPublicPath) {
          return true;
        }
        
        // For protected routes, require authentication
        return !!token;
      },
    },
    pages: {
      signIn: '/auth/login',
    },
  }
);

// Protect all routes except public ones
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
