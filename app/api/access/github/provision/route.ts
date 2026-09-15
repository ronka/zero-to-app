import { auth } from "@/lib/auth";
import { authorizeAccess } from "@/lib/access/authorization";
import {
  ACCESS_REPOSITORIES,
  githubAppConfigured,
  githubOAuthConfigured,
} from "@/lib/access/repositories";
import {
  claimEntitlement,
  claimGitHubRepositoryGrant,
  findActiveEntitlement,
  listGitHubRepositoryGrants,
  markGitHubRepositoryGrantFailed,
  markGitHubRepositoryGrantSucceeded,
  upsertGitHubConnection,
} from "@/lib/db";
import {
  addRepositoryCollaborator,
  createInstallationAccessToken,
  hasPendingRepositoryInvitation,
  isRepositoryCollaborator,
} from "@/lib/github/app";
import { provisionGitHubRepositories } from "@/lib/github/provision";

const ENTITLEMENT_KEY = "zero-to-saas";

function sameOrigin(request: Request) {
  const configured = process.env.BETTER_AUTH_URL;
  const origin = request.headers.get("origin");
  if (!configured || !origin) return false;
  return origin === new URL(configured).origin;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ message: "Invalid request origin" }, { status: 403 });
  }
  if (!githubOAuthConfigured() || !githubAppConfigured()) {
    return Response.json({ message: "GitHub access is not configured" }, { status: 503 });
  }

  const session = await auth.api.getSession({ headers: request.headers });
  const authorization = await authorizeAccess(session, ENTITLEMENT_KEY, {
    findEntitlement: findActiveEntitlement,
    claim: claimEntitlement,
  });
  if (authorization.status !== "granted") {
    return Response.json({ message: "Buyer access is required" }, { status: 403 });
  }

  const accounts = await auth.api.listUserAccounts({ headers: request.headers });
  const githubAccount = accounts.find((account) => account.providerId === "github");
  if (!githubAccount) {
    return Response.json({ message: "Connect a GitHub account first" }, { status: 409 });
  }

  try {
    const info = await auth.api.accountInfo({
      query: { accountId: githubAccount.id },
      headers: request.headers,
    });
    const profile = info.data as { id?: unknown; login?: unknown };
    if (typeof profile.login !== "string" || profile.login.length === 0) {
      throw new Error("GitHub did not return an account login");
    }
    if (profile.id !== undefined && String(profile.id) !== githubAccount.accountId) {
      throw new Error("GitHub account identity did not match the linked account");
    }

    const connection = await upsertGitHubConnection(
      session!.user.id,
      githubAccount.id,
      githubAccount.accountId,
      profile.login,
    );
    await provisionGitHubRepositories({
      entitlementId: authorization.entitlement.id,
      connectionUserId: connection.userId,
      githubLogin: connection.githubLogin,
      repositories: ACCESS_REPOSITORIES,
    }, {
      claim: claimGitHubRepositoryGrant,
      createToken: createInstallationAccessToken,
      check: isRepositoryCollaborator,
      hasPendingInvitation: hasPendingRepositoryInvitation,
      invite: addRepositoryCollaborator,
      markFailed: markGitHubRepositoryGrantFailed,
      markSucceeded: markGitHubRepositoryGrantSucceeded,
    });
    const grants = await listGitHubRepositoryGrants(authorization.entitlement.id);
    return Response.json({ grants });
  } catch (error) {
    console.error("GitHub access provisioning failed", {
      userId: session!.user.id,
      entitlementId: authorization.entitlement.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return Response.json(
      { message: "GitHub access could not be provisioned. Please retry." },
      { status: 502 },
    );
  }
}
