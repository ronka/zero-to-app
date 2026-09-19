import { headers } from "next/headers";

import { readAccess } from "@/lib/access/authorization";
import { normalizeEmail } from "@/lib/access/email";
import { auth } from "@/lib/auth";
import {
  countRecentFeatureRequests,
  findActiveEntitlement,
  insertFeatureRequest,
} from "@/lib/db";
import {
  featureRequestHttpResponse,
  submitFeatureRequest,
  type FeatureRequestInput,
} from "@/lib/feedback/request";
import { ZERO_TO_APP_ENTITLEMENT_KEY } from "@/lib/grow/products";

function refuse(message: string, status: 400 | 401 | 403) {
  return Response.json({ ok: false, message }, { status });
}

function readInput(contentType: string, request: Request) {
  if (contentType.includes("application/json")) {
    return request.json() as Promise<FeatureRequestInput>;
  }
  return request.formData().then<FeatureRequestInput>((form) => ({
    kind: form.get("kind"),
    target: form.get("target"),
    title: form.get("title"),
    body: form.get("body"),
    website: form.get("website") ?? undefined,
  }));
}

export async function POST(request: Request) {
  // The /access page check does not protect this route; authorize here too.
  // readAccess, not authorizeAccess: submitting feedback must not claim the
  // entitlement, so a malformed or rate-limited POST writes nothing.
  const session = await auth.api.getSession({ headers: await headers() });
  const authorization = await readAccess(session, ZERO_TO_APP_ENTITLEMENT_KEY, {
    findEntitlement: findActiveEntitlement,
  });
  if (authorization.status === "denied") {
    return refuse("לא נמצאה גישה לחשבון הזה.", 403);
  }
  if (authorization.status !== "granted" || !session?.user) {
    return refuse("התחברו כדי לשלוח פנייה.", 401);
  }

  let input: FeatureRequestInput;
  try {
    input = await readInput(request.headers.get("content-type")?.toLowerCase() ?? "", request);
  } catch {
    return refuse("לא הצלחנו לקרוא את הפנייה.", 400);
  }

  const result = await submitFeatureRequest(
    input,
    {
      userId: session.user.id,
      entitlementId: authorization.entitlement.id,
      subjectEmail: normalizeEmail(session.user.email),
    },
    { countRecent: countRecentFeatureRequests, insert: insertFeatureRequest },
  );
  return featureRequestHttpResponse(result);
}
