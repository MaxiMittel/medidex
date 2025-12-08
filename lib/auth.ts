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
      const roles = await prisma.user.findUnique({
        where: {
          id: user.id,
        },
        select: {
          roles: true,
        },
      });

      return {
        roles: roles?.roles as Role[],
        user,
        session,
      };
    }),
  ],
});
