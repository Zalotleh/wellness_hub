import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token.id) {
        session.user.id = token.id as string;
        
        // Fetch fresh user data including subscription info and role
        try {
          const userData = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              role: true,
              subscriptionTier: true,
              subscriptionStatus: true,
              trialEndsAt: true,
              subscriptionEndsAt: true,
              mealPlansThisMonth: true,
              aiQuestionsThisMonth: true,
            },
          });
          
          if (userData) {
            // Add subscription data and role to session
            (session.user as any).role = userData.role;
            (session.user as any).subscriptionTier = userData.subscriptionTier;
            (session.user as any).subscriptionStatus = userData.subscriptionStatus;
            (session.user as any).trialEndsAt = userData.trialEndsAt;
            (session.user as any).subscriptionEndsAt = userData.subscriptionEndsAt;
            (session.user as any).mealPlansThisMonth = userData.mealPlansThisMonth;
            (session.user as any).aiQuestionsThisMonth = userData.aiQuestionsThisMonth;
          }
        } catch (error) {
          console.error('Error fetching user subscription data:', error);
        }
      }
      return session;
    },
  },
};
