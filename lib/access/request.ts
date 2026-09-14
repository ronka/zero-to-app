import { createHmac } from "node:crypto";

import type { AccessEmailDelivery } from "../grow/webhook";
import { isPlausibleEmail, normalizeEmail } from "./email";

export const MAGIC_LINK_GENERIC_RESPONSE = {
  ok: true,
  message: "אם קיימת רכישה מתאימה, נשלח אליכם קישור כניסה.",
};

export type PublicMagicLinkDependencies = {
  consumeRateLimit: (fingerprint: string) => Promise<boolean>;
  queue: (email: string) => Promise<AccessEmailDelivery | null>;
  dispatch: (delivery: AccessEmailDelivery) => Promise<void>;
  secret: string;
};

export async function requestBuyerMagicLink(
  input: { email: unknown; ip: string; website?: unknown },
  dependencies: PublicMagicLinkDependencies,
) {
  const rawEmail = typeof input.email === "string" ? input.email : "";
  const email = normalizeEmail(rawEmail);
  const fingerprint = createHmac("sha256", dependencies.secret)
    .update(`${input.ip}\0${email}`)
    .digest("hex");
  const allowed = await dependencies.consumeRateLimit(fingerprint);

  if ((input.website !== undefined && input.website !== "") || !isPlausibleEmail(email)) {
    return MAGIC_LINK_GENERIC_RESPONSE;
  }
  if (!allowed) return MAGIC_LINK_GENERIC_RESPONSE;

  const delivery = await dependencies.queue(email);
  if (delivery) {
    try {
      await dependencies.dispatch(delivery);
    } catch {
      // The delivery remains failed and can be retried without exposing it publicly.
    }
  }

  return MAGIC_LINK_GENERIC_RESPONSE;
}
