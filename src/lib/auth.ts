import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"

import { Role } from "@/generated/prisma/enums"
import prisma from "@/lib/prisma"

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      // `input: false` keeps these server managed so a client can never
      // escalate its own privileges through sign-up / update-user payloads.
      roles: {
        type: Object.values(Role),
        required: false,
        defaultValue: [Role.USER],
        input: false,
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
      phone: {
        type: "string",
        required: false,
        input: false,
      },
      // Index (or url) of the picture the user picked from their `image` array.
      selactedImg: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
})

export type AuthSession = typeof auth.$Infer.Session
export type AuthSessionUser = AuthSession["user"]
