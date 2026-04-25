import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' },
        action: { label: 'Action', type: 'text' },
      },
      async authorize(credentials) {
        const email = credentials.email as string;
        const password = credentials.password as string;
        const name = credentials.name as string | undefined;
        const action = credentials.action as string | undefined;

        if (!email || !password) return null;

        if (action === 'register') {
          // Check if user exists
          const existing = await db.query.users.findFirst({
            where: eq(schema.users.email, email),
          });
          if (existing) return null;

          const hash = await bcrypt.hash(password, 12);
          const hue = Math.floor(Math.random() * 6) + 1;

          const [user] = await db
            .insert(schema.users)
            .values({
              email,
              name: name || email.split('@')[0],
              passwordHash: hash,
              hue,
            })
            .returning();

          return { id: user.id, email: user.email, name: user.name, image: user.image };
        }

        // Login
        const user = await db.query.users.findFirst({
          where: eq(schema.users.email, email),
        });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
