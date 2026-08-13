import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      const isDashboardRoute =
        nextUrl.pathname.startsWith('/dashboard') ||
        nextUrl.pathname.startsWith('/workouts') ||
        nextUrl.pathname.startsWith('/nutrition') ||
        nextUrl.pathname.startsWith('/settings');

      if (isDashboardRoute) {
        if (isLoggedIn) return true;
        return false;
      }

      const isAuthOrRootRoute =
        nextUrl.pathname === '/' ||
        nextUrl.pathname.startsWith('/login') ||
        nextUrl.pathname.startsWith('/register');

      if (isAuthOrRootRoute && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
