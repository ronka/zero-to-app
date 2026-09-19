import { normalizeEmail } from "../access/email";
import { FEATURE_REQUEST_STATUSES, type FeatureRequestStatus } from "../feedback/types";

/** The single operator account. Not a secret; overridable without a code change. */
export const ADMIN_EMAIL = normalizeEmail(process.env.ADMIN_EMAIL ?? "ronkamail@gmail.com");

type AdminSession = {
  user: { email: string; emailVerified: boolean };
} | null;

/**
 * Admin access is decided by verified email alone. It deliberately does not
 * consult entitlements: operating the panel is not the same as owning a licence.
 */
export function isAdminSession(session: AdminSession) {
  if (!session?.user?.emailVerified) return false;
  return normalizeEmail(session.user.email) === ADMIN_EMAIL;
}

export type StatusUpdate = { id: string; status: FeatureRequestStatus; note: string | null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isStatus(value: unknown): value is FeatureRequestStatus {
  return FEATURE_REQUEST_STATUSES.includes(value as FeatureRequestStatus);
}

/**
 * Validates before the value reaches Postgres, so a bad status is a 400 rather
 * than a CHECK-constraint 500.
 */
export function parseStatusUpdate(input: {
  id: unknown;
  status: unknown;
  note?: unknown;
}): StatusUpdate | null {
  if (typeof input.id !== "string" || !UUID.test(input.id)) return null;
  if (!isStatus(input.status)) return null;
  const note = typeof input.note === "string" ? input.note.trim().slice(0, 2000) : "";
  return { id: input.id, status: input.status, note: note.length > 0 ? note : null };
}
