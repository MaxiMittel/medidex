import { betterAuth } from "better-auth";
import { customSession } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import prisma from "./db";
import { Role } from "../enums/role.enum";
import { jwt } from "better-auth/plugins";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    jwt(),
    nextCookies(),
    customSession(async ({ user, session }) => {
      const dbUser = await prisma.user.findUnique({
        where: {
          id: user.id,
        },
        select: {
          roles: true,
          isApproved: true,
        },
      });

      return {
        roles: dbUser?.roles as Role[],
        isApproved: dbUser?.isApproved ?? false,
        user,
        session,
      };
    }),
  ],
  user: {
    // Hook to auto-approve admins after user creation
    afterCreate: async (user) => {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { roles: true },
      });

      // Auto-approve if user has ADMIN role
      if (dbUser?.roles.includes(Role.ADMIN)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isApproved: true },
        });
      }
    },
  },
});
