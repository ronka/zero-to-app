import { auth } from "../auth";
import {
  claimAccessEmailDelivery,
  consumeMagicLinkRateLimit,
  markAccessEmailFailed,
  queueAccessEmailForBuyer,
} from "../db";
import { authBaseUrl } from "../auth-url";
import { dispatchClaimedAccessEmail } from "./dispatch";
import {
  MAGIC_LINK_GENERIC_RESPONSE,
  requestBuyerMagicLink,
  type PublicMagicLinkDependencies,
} from "./request";
import type { AccessEmailDelivery } from "./types";

export { MAGIC_LINK_GENERIC_RESPONSE, requestBuyerMagicLink } from "./request";

export async function dispatchAccessEmail(delivery: AccessEmailDelivery) {
  await dispatchClaimedAccessEmail(delivery, {
    claim: claimAccessEmailDelivery,
    markFailed: markAccessEmailFailed,
    send: async (claimed) => {
      await auth.api.signInMagicLink({
        body: {
          email: claimed.payerEmail,
          name: claimed.payerName,
          callbackURL: claimed.callbackPath,
          newUserCallbackURL: claimed.callbackPath,
          errorCallbackURL: "/auth/error",
          metadata: {
            deliveryId: claimed.id,
            deliveryKind: claimed.kind,
            productName: claimed.productName,
          },
        },
        headers: new Headers({
          origin: authBaseUrl(),
          "user-agent": "zero-to-app-access-delivery",
        }),
      });
    },
  });
}

function defaultDependencies(): PublicMagicLinkDependencies {
  const secret = process.env.MAGIC_LINK_RATE_LIMIT_SECRET ?? process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("MAGIC_LINK_RATE_LIMIT_SECRET or BETTER_AUTH_SECRET is required");
  return {
    consumeRateLimit: consumeMagicLinkRateLimit,
    queue: queueAccessEmailForBuyer,
    dispatch: dispatchAccessEmail,
    secret,
  };
}

export function requestIp(request: Request) {
  return (
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function handlePublicMagicLinkRequest(request: Request) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  let email: unknown;
  let website: unknown;

  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { email?: unknown; website?: unknown };
      email = body.email;
      website = body.website;
    } else {
      const form = await request.formData();
      email = form.get("email");
      website = form.get("website");
    }
  } catch {
    return Response.json(MAGIC_LINK_GENERIC_RESPONSE);
  }

  const result = await requestBuyerMagicLink(
    { email, website, ip: requestIp(request) },
    defaultDependencies(),
  );
  return Response.json(result);
}
