import { normalizeEmail } from "./email";

type AccessSession = {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
  };
} | null;

type Entitlement = { id: string } | null;

export async function authorizeAccess(
  session: AccessSession,
  entitlementKey: string,
  dependencies: {
    findEntitlement: (email: string, key: string) => Promise<Entitlement>;
    claim: (id: string, userId: string) => Promise<boolean>;
  },
) {
  if (!session?.user) return { status: "anonymous" as const };
  if (!session.user.emailVerified) return { status: "unverified" as const };

  const entitlement = await dependencies.findEntitlement(
    normalizeEmail(session.user.email),
    entitlementKey,
  );
  if (!entitlement) return { status: "denied" as const };
  if (!(await dependencies.claim(entitlement.id, session.user.id))) {
    return { status: "denied" as const };
  }
  return { status: "granted" as const, entitlement: { id: entitlement.id } };
}
