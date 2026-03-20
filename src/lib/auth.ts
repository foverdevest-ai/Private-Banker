import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { env, allowedEmails, isDemoMode } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  secret: env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      id: "demo",
      name: "Demo Mode",
      credentials: {},
      async authorize() {
        if (!isDemoMode) {
          return null;
        }
        return {
          id: "demo-user",
          email: env.APP_DEMO_EMAIL,
          name: "Demo User",
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "demo") {
        return true;
      }
      const email = user.email?.toLowerCase();
      if (!email) {
        return false;
      }
      if (allowedEmails.size === 0) {
        return true;
      }
      return allowedEmails.has(email);
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
      }
      if (user?.name) {
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      session.user ??= { email: null, name: null };
      if (token.email) {
        session.user.email = token.email;
      }
      if (token.name) {
        session.user.name = token.name;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
};

export async function auth() {
  return getServerSession(authOptions);
}

export async function getCurrentUserOrThrow() {
  const session = await auth();
  const email = session?.user?.email ?? (isDemoMode ? env.APP_DEMO_EMAIL : null);
  if (!email) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: { name: session?.user?.name ?? undefined },
    create: {
      email,
      name: session?.user?.name ?? "Private Banker User",
    },
  });

  return user;
}
