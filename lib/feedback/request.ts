import {
  FEATURE_REQUEST_BODY_LIMITS,
  FEATURE_REQUEST_KINDS,
  FEATURE_REQUEST_TARGETS,
  FEATURE_REQUEST_TITLE_LIMITS,
  type FeatureRequestIdentity,
  type FeatureRequestInsert,
  type FeatureRequestKind,
  type FeatureRequestTarget,
} from "./types";

export const FEATURE_REQUEST_SUCCESS_RESPONSE = {
  ok: true,
  message: "תודה! הבקשה נרשמה ואעבור עליה.",
} as const;

export const FEATURE_REQUEST_RATE_LIMIT_RESPONSE = {
  ok: false,
  message: "שלחתם כמה בקשות ברצף. אפשר לשלוח עוד בעוד שעה.",
} as const;

export const FEATURE_REQUEST_HOURLY_LIMIT = 5;

export type FeatureRequestResult =
  | { body: typeof FEATURE_REQUEST_SUCCESS_RESPONSE; status: 200 }
  | { body: { ok: false; message: string }; status: 400 }
  | { body: typeof FEATURE_REQUEST_RATE_LIMIT_RESPONSE; status: 429 };

export function featureRequestHttpResponse(result: FeatureRequestResult) {
  return Response.json(result.body, {
    status: result.status,
    headers: result.status === 429 ? { "Retry-After": "3600" } : undefined,
  });
}

function invalid(message: string): FeatureRequestResult {
  return { body: { ok: false, message }, status: 400 };
}

/** Drops C0/C1 control characters. Newlines survive only where `allowNewlines` is set. */
function stripControlCharacters(value: string, allowNewlines: boolean) {
  const normalized = allowNewlines ? value.replace(/\r\n?/g, "\n") : value;
  // Iterate by code point so surrogate pairs (emoji) are never split apart.
  return [...normalized]
    .filter((character) => {
      if (allowNewlines && character === "\n") return true;
      const code = character.codePointAt(0) ?? 0;
      return !(code <= 0x1f || (code >= 0x7f && code <= 0x9f));
    })
    .join("");
}

function cleanText(value: unknown, allowNewlines: boolean) {
  if (typeof value !== "string") return "";
  return stripControlCharacters(value, allowNewlines).trim();
}

function isKind(value: unknown): value is FeatureRequestKind {
  return FEATURE_REQUEST_KINDS.includes(value as FeatureRequestKind);
}

function isTarget(value: unknown): value is FeatureRequestTarget {
  return FEATURE_REQUEST_TARGETS.includes(value as FeatureRequestTarget);
}

export type FeatureRequestInput = {
  kind: unknown;
  target: unknown;
  title: unknown;
  body: unknown;
  website?: unknown;
};

export type FeatureRequestDependencies = {
  countRecent: (userId: string) => Promise<number>;
  insert: (request: FeatureRequestInsert) => Promise<void>;
};

export async function submitFeatureRequest(
  input: FeatureRequestInput,
  identity: FeatureRequestIdentity,
  dependencies: FeatureRequestDependencies,
): Promise<FeatureRequestResult> {
  // A filled honeypot is answered like a success so a bot learns nothing.
  if (input.website !== undefined && input.website !== "") {
    return { body: FEATURE_REQUEST_SUCCESS_RESPONSE, status: 200 };
  }

  if (!isKind(input.kind)) return invalid("בחרו סוג פנייה.");
  if (!isTarget(input.target)) return invalid("בחרו על מה הפנייה.");

  const title = cleanText(input.title, false);
  if (title.length < FEATURE_REQUEST_TITLE_LIMITS.minimum) {
    return invalid("כתבו נושא קצר לפנייה.");
  }
  if (title.length > FEATURE_REQUEST_TITLE_LIMITS.maximum) {
    return invalid(`הנושא ארוך מדי. עד ${FEATURE_REQUEST_TITLE_LIMITS.maximum} תווים.`);
  }

  const body = cleanText(input.body, true);
  if (body.length < FEATURE_REQUEST_BODY_LIMITS.minimum) {
    return invalid("כתבו קצת יותר כדי שאבין מה נדרש.");
  }
  if (body.length > FEATURE_REQUEST_BODY_LIMITS.maximum) {
    return invalid(`הפנייה ארוכה מדי. עד ${FEATURE_REQUEST_BODY_LIMITS.maximum} תווים.`);
  }

  const recent = await dependencies.countRecent(identity.userId);
  if (recent >= FEATURE_REQUEST_HOURLY_LIMIT) {
    return { body: FEATURE_REQUEST_RATE_LIMIT_RESPONSE, status: 429 };
  }

  await dependencies.insert({
    ...identity,
    kind: input.kind,
    target: input.target,
    title,
    body,
  });

  return { body: FEATURE_REQUEST_SUCCESS_RESPONSE, status: 200 };
}
