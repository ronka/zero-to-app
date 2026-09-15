import { createSign } from "node:crypto";

import type { AccessRepository } from "../access/repositories";

const GITHUB_API_VERSION = "2022-11-28";

type GitHubError = {
  message?: string;
  documentation_url?: string;
};

export type CollaboratorResult =
  | { state: "active"; invitationId: null; invitationUrl: null }
  | { state: "invited"; invitationId: string | null; invitationUrl: string | null };

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function appJwt() {
  const now = Math.floor(Date.now() / 1000);
  const header = encode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = encode(
    JSON.stringify({ iat: now - 60, exp: now + 9 * 60, iss: required("GITHUB_APP_ID") }),
  );
  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const privateKey = required("GITHUB_APP_PRIVATE_KEY").replace(/\\n/g, "\n");
  return `${unsigned}.${signer.sign(privateKey, "base64url")}`;
}

function headers(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "User-Agent": "zero-to-saas-access",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };
}

async function githubError(response: Response) {
  let detail: GitHubError = {};
  try {
    detail = (await response.json()) as GitHubError;
  } catch {
    // GitHub occasionally returns an empty or non-JSON error response.
  }
  const message = detail.message?.slice(0, 300) ?? response.statusText;
  return new Error(`GitHub API ${response.status}: ${message}`);
}

export async function createInstallationAccessToken() {
  const installationId = required("GITHUB_APP_INSTALLATION_ID");
  const response = await fetch(
    `https://api.github.com/app/installations/${encodeURIComponent(installationId)}/access_tokens`,
    { method: "POST", headers: headers(appJwt()), cache: "no-store" },
  );
  if (!response.ok) throw await githubError(response);
  const body = (await response.json()) as { token?: unknown };
  if (typeof body.token !== "string") throw new Error("GitHub did not return an installation token");
  return body.token;
}

export async function addRepositoryCollaborator(
  token: string,
  repository: Pick<AccessRepository, "owner" | "repo">,
  username: string,
): Promise<CollaboratorResult> {
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}/collaborators/${encodeURIComponent(username)}`,
    {
      method: "PUT",
      headers: { ...headers(token), "Content-Type": "application/json" },
      body: JSON.stringify({ permission: "pull" }),
      cache: "no-store",
    },
  );

  if (response.status === 204) {
    return { state: "active", invitationId: null, invitationUrl: null };
  }
  if (response.status !== 201) throw await githubError(response);

  const body = (await response.json()) as { id?: unknown; html_url?: unknown };
  return {
    state: "invited",
    invitationId:
      typeof body.id === "number" || typeof body.id === "string" ? String(body.id) : null,
    invitationUrl: typeof body.html_url === "string" ? body.html_url : null,
  };
}

export async function isRepositoryCollaborator(
  token: string,
  repository: Pick<AccessRepository, "owner" | "repo">,
  username: string,
) {
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}/collaborators/${encodeURIComponent(username)}`,
    { headers: headers(token), cache: "no-store" },
  );
  if (response.status === 204) return true;
  if (response.status === 404) return false;
  throw await githubError(response);
}

export async function hasPendingRepositoryInvitation(
  token: string,
  repository: Pick<AccessRepository, "owner" | "repo">,
  username: string,
  invitationId: string | null,
) {
  for (let page = 1; page <= 10; page += 1) {
    const response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}/invitations?per_page=100&page=${page}`,
      { headers: headers(token), cache: "no-store" },
    );
    if (!response.ok) throw await githubError(response);
    const invitations = (await response.json()) as Array<{
      id?: unknown;
      invitee?: { login?: unknown };
    }>;
    if (
      invitations.some(
        (invitation) =>
          (invitationId !== null && String(invitation.id) === invitationId) ||
          (typeof invitation.invitee?.login === "string" &&
            invitation.invitee.login.toLowerCase() === username.toLowerCase()),
      )
    ) {
      return true;
    }
    if (invitations.length < 100) return false;
  }
  throw new Error("GitHub invitation lookup exceeded the pagination limit");
}
