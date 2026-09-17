import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";

import { authBaseUrl } from "./auth-url";
import { database } from "./database";
import { MAGIC_LINK_EXPIRES_IN_SECONDS, sendMagicLinkEmail } from "./email";

export const auth = betterAuth({
  baseURL: authBaseUrl(),
  database,
  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      disableImplicitLinking: true,
      allowDifferentEmails: true,
    },
  },
  socialProviders:
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            disableSignUp: true,
            disableDefaultScope: true,
          },
        }
      : {},
  plugins: [
    magicLink({
      disableSignUp: false,
      expiresIn: MAGIC_LINK_EXPIRES_IN_SECONDS,
      rateLimit: { window: 60, max: 5 },
      storeToken: "hashed",
      sendMagicLink: sendMagicLinkEmail,
    }),
  ],
});
