import { normalizeEmail } from "./email";

type AccessSession = {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
  };
} | null;

type Entitlement = { id: string } | null;

/**
 * Resolves entitlement without writing. Use this for endpoints that only need to
 * know whether the buyer has access; `authorizeAccess` additionally claims it.
 */
export async function readAccess(
  session: AccessSession,
  entitlementKey: string,
  dependencies: {
    findEntitlement: (email: string, key: string) => Promise<Entitlement>;
  },
) {
  if (!session?.user) return { status: "anonymous" as const };
  if (!session.user.emailVerified) return { status: "unverified" as const };

  const entitlement = await dependencies.findEntitlement(
    normalizeEmail(session.user.email),
    entitlementKey,
  );
  if (!entitlement) return { status: "denied" as const };
  return { status: "granted" as const, entitlement: { id: entitlement.id } };
}

export async function authorizeAccess(
  session: AccessSession,
  entitlementKey: string,
  dependencies: {
    findEntitlement: (email: string, key: string) => Promise<Entitlement>;
    claim: (id: string, userId: string) => Promise<boolean>;
  },
) {
  const access = await readAccess(session, entitlementKey, dependencies);
  if (access.status !== "granted") return access;

  // Non-null: only the "granted" branch is reachable with a session present.
  const userId = session!.user.id;
  if (!(await dependencies.claim(access.entitlement.id, userId))) {
    return { status: "denied" as const };
  }
  return access;
}
