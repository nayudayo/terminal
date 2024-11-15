import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;

  if (!userId) {
    // Redirect to session initialization endpoint
    return NextResponse.redirect(new URL('/api/session', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/session (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/session|_next/static|_next/image|favicon.ico).*)',
  ],
}; 