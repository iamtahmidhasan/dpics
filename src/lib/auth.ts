import { APIError, betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"

import { Role } from "@/generated/prisma/enums"
import prisma from "@/lib/prisma"
import { normalizeImageList } from "@/lib/user-image"

/** Keeps `selactedImg` inside the bounds of the list it points into. */
function clampSelectedImage(selactedImg: unknown, imageCount: number): string {
  const index = Number.parseInt(typeof selactedImg === "string" ? selactedImg : "", 10)

  return Number.isInteger(index) && index >= 0 && index < imageCount ? String(index) : "0"
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
      updateUserInfoOnLink: true,
    },
  },
  socialProviders: {
    google: {
      clientId: (process.env.GOOGLE_CLIENT_ID ?? "") as string,
      clientSecret: (process.env.GOOGLE_CLIENT_SECRET ?? "") as string,
      overrideUserInfoOnSignIn: true,
      mapProfileToUser: (profile) => ({
        image: profile.picture,
      }),
    },
    github: {
      clientId: (process.env.GITHUB_CLIENT_ID ?? "") as string,
      clientSecret: (process.env.GITHUB_CLIENT_SECRET ?? "") as string,
      overrideUserInfoOnSignIn: true,
      mapProfileToUser: (profile) => ({
        image: profile.avatar_url,
      }),
    },
  },
  emailAndPassword: {
    enabled: false,
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
  databaseHooks: {
    // `User.image` is a `String[]`, but Better Auth still models `image` as a
    // single string. Social providers hand over one avatar url, which Prisma
    // rejects with `Expected UserCreateimageInput or String[], provided String`,
    // so every value is widened to a list before it reaches the database.
    //
    // The casts below are deliberate: this schema is the source of truth, and
    // Better Auth's own `User` type has not caught up with it. Spreading the
    // real value keeps the runtime behaviour correct.
    user: {
      create: {
        before: async (user) => {
          const settings = prisma.setting
            ? await prisma.setting.findUnique({
                where: { id: "global" },
                select: { isSignupEnabled: true },
              })
            : null

          if (settings && !settings.isSignupEnabled) {
            throw new APIError("BAD_REQUEST", {
              message: "Registration is currently closed",
            })
          }

          const image = normalizeImageList(user.image)

          return {
            data: {
              ...user,
              image: image as unknown as typeof user.image,
              selactedImg: clampSelectedImage(user.selactedImg, image.length),
            },
          }
        },
      },
      update: {
        before: async (user) => {
          // Only touch `image` when the payload actually carries it, otherwise
          // a partial update would wipe the pictures already on the account.
          if (user.image === undefined) return

          const image = normalizeImageList(user.image)
          if (image.length === 0) {
            const { image: _omitted, ...rest } = user
            return { data: rest }
          }

          return {
            data: {
              ...user,
              image: image as unknown as typeof user.image,
              selactedImg: clampSelectedImage(user.selactedImg, image.length),
            },
          }
        },
      },
    },
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
})

export type AuthSession = typeof auth.$Infer.Session
export type AuthSessionUser = AuthSession["user"]
