import { NextResponse } from 'next/server';

export async function middleware(request) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/login' || 
                       path === '/signup' || 
                       path === '/register' ||  // Add this line
                       path === '/' ||
                       path.startsWith('/api/') ||
                       path.includes('.');

  // For Firebase auth, we'll use a simplified check
  // You can replace this with your own authentication logic
  const token = request.cookies.get('firebase-token')?.value;

  // Redirect logic for protected routes
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect logic for auth routes when user is already logged in
  if ((path === '/login' || path === '/signup' || path === '/register') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Configure which paths this middleware will run on
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
