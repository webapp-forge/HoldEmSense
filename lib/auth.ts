import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { checkAndGrantAchievements } from "./actions/achievements";

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                });

                if (!user || user.deletedAt) return null;

                const valid = await bcrypt.compare(
                    credentials.password as string,
                    user.passwordHash
                );

                if (!valid) return null;

                // Retroactively grant any achievements the user has earned but not yet received
                checkAndGrantAchievements(user.id).catch(() => {});

                return {
                    id: user.id,
                    email: user.email,
                    name: user.username,
                    isPremium: user.isPremium,
                    isAdmin: user.isAdmin,
                    emailVerified: user.emailVerified,
                };
            },
        }),
    ],
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
    },
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.isPremium = (user as any).isPremium as boolean;
                token.isAdmin = (user as any).isAdmin as boolean;
            }
            return token;
        },
        session({ session, token }) {
            session.user.id = token.id as string;
            (session.user as any).isPremium = token.isPremium as boolean;
            (session.user as any).isAdmin = token.isAdmin as boolean;
            return session;
        },
    },
});
