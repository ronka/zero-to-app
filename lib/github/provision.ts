import type { AccessRepository } from "../access/repositories";
import type { CollaboratorResult } from "./app";

export type ProvisionedRepository = {
  repository: string;
  state: "active" | "invited" | "failed";
};

export type GitHubProvisionDependencies = {
  claim: (
    entitlementId: string,
    connectionUserId: string,
    repository: string,
  ) => Promise<{ id: string; invitationId: string | null; invitationUrl: string | null } | null>;
  createToken: () => Promise<string>;
  check: (
    token: string,
    repository: Pick<AccessRepository, "owner" | "repo">,
    username: string,
  ) => Promise<boolean>;
  hasPendingInvitation: (
    token: string,
    repository: Pick<AccessRepository, "owner" | "repo">,
    username: string,
    invitationId: string | null,
  ) => Promise<boolean>;
  invite: (
    token: string,
    repository: Pick<AccessRepository, "owner" | "repo">,
    username: string,
  ) => Promise<CollaboratorResult>;
  markFailed: (id: string, error: unknown) => Promise<void>;
  markSucceeded: (
    id: string,
    state: "invited" | "active",
    invitationId: string | null,
    invitationUrl: string | null,
  ) => Promise<void>;
};

function safeError(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 500) : "GitHub access provisioning failed";
}

export async function provisionGitHubRepositories(
  input: {
    entitlementId: string;
    connectionUserId: string;
    githubLogin: string;
    repositories: AccessRepository[];
  },
  dependencies: GitHubProvisionDependencies,
): Promise<ProvisionedRepository[]> {
  const claims = await Promise.all(
    input.repositories.map(async (repository) => ({
      repository,
      grant: await dependencies.claim(
        input.entitlementId,
        input.connectionUserId,
        `${repository.owner}/${repository.repo}`,
      ),
    })),
  );
  const actionable = claims.filter(
    (
      claim,
    ): claim is {
      repository: AccessRepository;
      grant: { id: string; invitationId: string | null; invitationUrl: string | null };
    } => Boolean(claim.grant),
  );
  if (actionable.length === 0) return [];

  let token: string;
  try {
    token = await dependencies.createToken();
  } catch (error) {
    const message = safeError(error);
    await Promise.all(
      actionable.map(({ grant }) => dependencies.markFailed(grant.id, message)),
    );
    return actionable.map(({ repository }) => ({
      repository: `${repository.owner}/${repository.repo}`,
      state: "failed" as const,
    }));
  }

  return Promise.all(
    actionable.map(async ({ repository, grant }) => {
      const slug = `${repository.owner}/${repository.repo}`;
      try {
        if (grant.invitationId || grant.invitationUrl) {
          const active = await dependencies.check(token, repository, input.githubLogin);
          if (active) {
            await dependencies.markSucceeded(grant.id, "active", null, null);
            return { repository: slug, state: "active" as const };
          }
          const pending = await dependencies.hasPendingInvitation(
            token,
            repository,
            input.githubLogin,
            grant.invitationId,
          );
          if (pending) {
            await dependencies.markSucceeded(
              grant.id,
              "invited",
              grant.invitationId,
              grant.invitationUrl,
            );
            return { repository: slug, state: "invited" as const };
          }
        }
        const result = await dependencies.invite(token, repository, input.githubLogin);
        await dependencies.markSucceeded(
          grant.id,
          result.state,
          result.invitationId,
          result.invitationUrl,
        );
        return { repository: slug, state: result.state };
      } catch (error) {
        await dependencies.markFailed(grant.id, safeError(error));
        return { repository: slug, state: "failed" as const };
      }
    }),
  );
}
