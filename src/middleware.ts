import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth/session';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
    const cookieStore = await cookies();
    const cookie = cookieStore.get('auth_session')?.value;
    const session = await decrypt(cookie);

    const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');

    if (isDashboardRoute) {
        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const { role } = session;

        // RBAC Logic
        if (role === 'BUYER') {
            if (
                request.nextUrl.pathname.startsWith('/dashboard/admin-tier') ||
                request.nextUrl.pathname.startsWith('/dashboard/superadmin')
            ) {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
        }

        if (role === 'ADMIN_TIER') {
            if (request.nextUrl.pathname.startsWith('/dashboard/superadmin')) {
                return NextResponse.redirect(new URL('/dashboard/admin-tier', request.url));
            }
        }
    }

    // Redirect authenticated users away from /login
    if (request.nextUrl.pathname === '/login' && session) {
        if (session.role === 'SUPERADMIN') {
            return NextResponse.redirect(new URL('/dashboard/superadmin', request.url));
        } else if (session.role === 'ADMIN_TIER') {
            return NextResponse.redirect(new URL('/dashboard/admin-tier', request.url));
        } else {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
