import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { requireEmailVerification } from "@/lib/email-config";
import { ac, roles } from "@/lib/permissions";
import { DEFAULT_USER_ROLE, SUPER_ADMIN_ROLE } from "@/lib/roles";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification,
    ...(requireEmailVerification && {
      customSyntheticUser: ({ coreFields, additionalFields, id }) => ({
        ...coreFields,
        role: DEFAULT_USER_ROLE,
        banned: false,
        banReason: null,
        banExpires: null,
        ...additionalFields,
        id,
      }),
    }),
  },
  ...(requireEmailVerification && {
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        void sendVerificationEmail({
          to: user.email,
          name: user.name || "Usuario",
          url,
        });
      },
    },
  }),
  trustedOrigins: [
    process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
  ],
  secret:
    process.env.BETTER_AUTH_SECRET ??
    "lumixtv-local-dev-secret-xK9mP2vQ7wR4nL8jH5tF3sA6bC1dE0g",
  plugins: [
    admin({
      ac,
      roles,
      defaultRole: DEFAULT_USER_ROLE,
      adminRoles: [SUPER_ADMIN_ROLE],
      bannedUserMessage:
        "Tu cuenta ha sido suspendida. Contacta al administrador si crees que es un error.",
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
