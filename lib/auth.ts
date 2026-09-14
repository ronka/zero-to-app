import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";

import { database } from "./database";
import { MAGIC_LINK_EXPIRES_IN_SECONDS, sendMagicLinkEmail } from "./email";

export const auth = betterAuth({
  database,
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
