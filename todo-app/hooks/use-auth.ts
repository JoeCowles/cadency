'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export function useAuth() {
  const session = useSession();

  return {
    user: session.data?.user ?? null,
    isLoading: session.status === 'loading',
    isAuthenticated: session.status === 'authenticated',
    signInWithCredentials: (email: string, password: string) =>
      signIn('credentials', { email, password, redirect: false }),
    signUpWithCredentials: (email: string, password: string, name: string) =>
      signIn('credentials', { email, password, name, action: 'register', redirect: false }),
    signInWithGoogle: () => signIn('google'),
    signInWithGithub: () => signIn('github'),
    logout: () => signOut({ redirect: false }),
  };
}
