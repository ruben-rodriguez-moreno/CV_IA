import { NextResponse } from 'next/server';

export async function middleware(request) {
  const path = request.nextUrl.pathname;

  // Define public paths que no requieren autenticación
  const isPublicPath = path === '/auth/login' || 
                       path === '/auth/signup' || 
                       path === '/auth/register' || 
                       path === '/' ||
                       path.startsWith('/api/') ||
                       path.includes('.') ||
                       path === '/auth/forgot-password';

  // Obtén el token de autenticación
  const token = request.cookies.get('firebase-token')?.value;

  // Redirige a login si el usuario no está autenticado y la ruta no es pública
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Redirige al dashboard si el usuario ya está autenticado y está en una ruta pública
  if (isPublicPath && token && (path === '/auth/login' || path === '/auth/signup' || path === '/auth/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Configura las rutas donde se aplica el middleware
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};