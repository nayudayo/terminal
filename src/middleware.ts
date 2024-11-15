import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Skip middleware for specific paths
  if (
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon.ico') ||
    request.nextUrl.pathname === '/terminal' ||
    request.nextUrl.pathname === '/auth/callback'
  ) {
    return NextResponse.next();
  }

  const originalUserId = request.cookies.get('originalUserId')?.value;
  
  if (!originalUserId && !request.nextUrl.pathname.startsWith('/api/session/create')) {
    try {
      // Generate a new userId
      const newUserId = crypto.randomUUID();
      
      // Create a new response
      const response = NextResponse.next();
      
      // Set the cookie with longer expiration
      response.cookies.set('originalUserId', newUserId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });

      // Make an API call to initialize the user
      fetch(`${request.nextUrl.origin}/api/user/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: newUserId }),
      }).catch(console.error); // Non-blocking

      return response;
    } catch (error) {
      console.error('Error in middleware:', error);
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};