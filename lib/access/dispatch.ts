import type { AccessEmailDelivery } from "../grow/webhook";

export async function dispatchClaimedAccessEmail(
  candidate: AccessEmailDelivery,
  dependencies: {
    claim: (id: string) => Promise<AccessEmailDelivery | null>;
    send: (delivery: AccessEmailDelivery) => Promise<void>;
    markFailed: (id: string, error: unknown) => Promise<void>;
  },
) {
  const claimed = await dependencies.claim(candidate.id);
  if (!claimed) return false;

  try {
    await dependencies.send(claimed);
    return true;
  } catch (error) {
    await dependencies.markFailed(claimed.id, error);
    throw error;
  }
}
