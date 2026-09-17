import { createHmac } from "node:crypto";

import { isPlausibleEmail, normalizeEmail } from "./email";
import type { AccessEmailDelivery } from "./types";

export const MAGIC_LINK_GENERIC_RESPONSE = {
  ok: true,
  message: "אם קיימת רכישה מתאימה, נשלח אליכם קישור כניסה.",
} as const;

export const MAGIC_LINK_RATE_LIMIT_RESPONSE = {
  ok: false,
  message: "יותר מדי ניסיונות. נסו שוב בעוד 15 דקות.",
} as const;

export type PublicMagicLinkResult =
  | { body: typeof MAGIC_LINK_GENERIC_RESPONSE; status: 200 }
  | { body: typeof MAGIC_LINK_RATE_LIMIT_RESPONSE; status: 429 };

export function magicLinkHttpResponse(result: PublicMagicLinkResult) {
  return Response.json(result.body, {
    status: result.status,
    headers: result.status === 429 ? { "Retry-After": "900" } : undefined,
  });
}

export type PublicMagicLinkDependencies = {
  consumeRateLimit: (fingerprint: string) => Promise<boolean>;
  queue: (email: string) => Promise<AccessEmailDelivery | null>;
  dispatch: (delivery: AccessEmailDelivery) => Promise<void>;
  secret: string;
};

export async function requestBuyerMagicLink(
  input: { email: unknown; ip: string; website?: unknown },
  dependencies: PublicMagicLinkDependencies,
): Promise<PublicMagicLinkResult> {
  const rawEmail = typeof input.email === "string" ? input.email : "";
  const email = normalizeEmail(rawEmail);
  const fingerprint = createHmac("sha256", dependencies.secret)
    .update(`${input.ip}\0${email}`)
    .digest("hex");
  const allowed = await dependencies.consumeRateLimit(fingerprint);

  if ((input.website !== undefined && input.website !== "") || !isPlausibleEmail(email)) {
    return { body: MAGIC_LINK_GENERIC_RESPONSE, status: 200 };
  }
  if (!allowed) return { body: MAGIC_LINK_RATE_LIMIT_RESPONSE, status: 429 };

  const delivery = await dependencies.queue(email);
  if (delivery) {
    try {
      await dependencies.dispatch(delivery);
    } catch {
      // The delivery remains failed and can be retried without exposing it publicly.
    }
  }

  return { body: MAGIC_LINK_GENERIC_RESPONSE, status: 200 };
}
