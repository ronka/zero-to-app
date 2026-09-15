import assert from "node:assert/strict";
import test from "node:test";

import { provisionGitHubRepositories } from "../lib/github/provision";

const repositories = [
  {
    id: "web" as const,
    index: "01 / WEB",
    stack: "Next.js",
    title: "Web",
    description: "Web starter",
    url: "https://github.com/example/web",
    owner: "example",
    repo: "web",
    accent: "lime",
    tags: [],
  },
  {
    id: "mobile" as const,
    index: "02 / MOBILE",
    stack: "Expo",
    title: "Mobile",
    description: "Mobile starter",
    url: "https://github.com/example/mobile",
    owner: "example",
    repo: "mobile",
    accent: "blue",
    tags: [],
  },
];

test("provisions active and invited repositories with one installation token", async () => {
  const succeeded: Array<{ id: string; state: string }> = [];
  let tokenCalls = 0;
  const result = await provisionGitHubRepositories(
    {
      entitlementId: "entitlement-1",
      connectionUserId: "user-1",
      githubLogin: "buyer",
      repositories,
    },
    {
      claim: async (_entitlementId, _userId, repository) => ({
        id: `grant-${repository}`,
        invitationId: null,
        invitationUrl: null,
      }),
      createToken: async () => {
        tokenCalls += 1;
        return "installation-token";
      },
      check: async () => false,
      hasPendingInvitation: async () => false,
      invite: async (_token, repository) =>
        repository.repo === "web"
          ? { state: "active", invitationId: null, invitationUrl: null }
          : {
              state: "invited",
              invitationId: "42",
              invitationUrl: "https://github.com/example/mobile/invitations",
            },
      markSucceeded: async (id, state) => {
        succeeded.push({ id, state });
      },
      markFailed: async () => {},
    },
  );

  assert.equal(tokenCalls, 1);
  assert.deepEqual(result, [
    { repository: "example/web", state: "active" },
    { repository: "example/mobile", state: "invited" },
  ]);
  assert.deepEqual(succeeded, [
    { id: "grant-example/web", state: "active" },
    { id: "grant-example/mobile", state: "invited" },
  ]);
});

test("records token and per-repository failures without throwing away other results", async () => {
  const tokenFailures: string[] = [];
  const tokenResult = await provisionGitHubRepositories(
    {
      entitlementId: "entitlement-1",
      connectionUserId: "user-1",
      githubLogin: "buyer",
      repositories,
    },
    {
      claim: async (_entitlementId, _userId, repository) => ({
        id: `grant-${repository}`,
        invitationId: null,
        invitationUrl: null,
      }),
      createToken: async () => {
        throw new Error("bad app credentials");
      },
      check: async () => false,
      hasPendingInvitation: async () => false,
      invite: async () => ({ state: "active", invitationId: null, invitationUrl: null }),
      markSucceeded: async () => {},
      markFailed: async (id) => {
        tokenFailures.push(id);
      },
    },
  );
  assert.deepEqual(tokenFailures.sort(), ["grant-example/mobile", "grant-example/web"]);
  assert.equal(tokenResult.every((item) => item.state === "failed"), true);

  const failed: string[] = [];
  const succeeded: string[] = [];
  const partialResult = await provisionGitHubRepositories(
    {
      entitlementId: "entitlement-1",
      connectionUserId: "user-1",
      githubLogin: "buyer",
      repositories,
    },
    {
      claim: async (_entitlementId, _userId, repository) => ({
        id: `grant-${repository}`,
        invitationId: null,
        invitationUrl: null,
      }),
      createToken: async () => "installation-token",
      check: async () => false,
      hasPendingInvitation: async () => false,
      invite: async (_token, repository) => {
        if (repository.repo === "mobile") throw new Error("GitHub API 403");
        return { state: "active", invitationId: null, invitationUrl: null };
      },
      markSucceeded: async (id) => {
        succeeded.push(id);
      },
      markFailed: async (id) => {
        failed.push(id);
      },
    },
  );

  assert.deepEqual(succeeded, ["grant-example/web"]);
  assert.deepEqual(failed, ["grant-example/mobile"]);
  assert.deepEqual(partialResult, [
    { repository: "example/web", state: "active" },
    { repository: "example/mobile", state: "failed" },
  ]);
});

test("rechecks a recorded invitation without sending another one", async () => {
  let inviteCalls = 0;
  const succeeded: Array<{ id: string; state: string }> = [];
  const result = await provisionGitHubRepositories(
    {
      entitlementId: "entitlement-1",
      connectionUserId: "user-1",
      githubLogin: "buyer",
      repositories: [repositories[0]],
    },
    {
      claim: async () => ({
        id: "grant-web",
        invitationId: "42",
        invitationUrl: "https://github.com/example/web/invitations",
      }),
      createToken: async () => "installation-token",
      check: async () => true,
      hasPendingInvitation: async () => true,
      invite: async () => {
        inviteCalls += 1;
        return { state: "active", invitationId: null, invitationUrl: null };
      },
      markSucceeded: async (id, state) => {
        succeeded.push({ id, state });
      },
      markFailed: async () => {},
    },
  );

  assert.equal(inviteCalls, 0);
  assert.deepEqual(succeeded, [{ id: "grant-web", state: "active" }]);
  assert.deepEqual(result, [{ repository: "example/web", state: "active" }]);
});
