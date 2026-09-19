import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { authorizeAccess } from "@/lib/access/authorization";
import { isAdminSession } from "@/lib/admin/authorization";
import {
  ACCESS_REPOSITORIES,
  githubAppConfigured,
  githubOAuthConfigured,
} from "@/lib/access/repositories";
import { auth } from "@/lib/auth";
import {
  claimEntitlement,
  findActiveEntitlement,
  findGitHubConnection,
  listGitHubRepositoryGrants,
} from "@/lib/db";
import { ZERO_TO_APP_ENTITLEMENT_KEY } from "@/lib/grow/products";

import { ProductAccess } from "./product-access";

export const metadata: Metadata = {
  title: "הגישה שלכם",
  robots: { index: false, follow: false },
};

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ github?: string }>;
}) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session?.user) redirect("/login");
  const authorization = await authorizeAccess(session, ZERO_TO_APP_ENTITLEMENT_KEY, {
    findEntitlement: findActiveEntitlement,
    claim: claimEntitlement,
  });
  if (authorization.status === "anonymous") redirect("/login");
  if (authorization.status === "unverified") redirect("/auth/error");

  if (authorization.status === "denied") {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-16">
        <section className="w-full max-w-lg rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-8 text-center">
          <h1 className="text-4xl font-black">לא נמצאה גישה לחשבון הזה</h1>
          <p className="mt-4 leading-7 text-zinc-400">התחברו באימייל ששימש לרכישה. אם נפלה טעות בכתובת, פנו לתמיכה כדי שנוכל לבדוק אותה בבטחה.</p>
          <Link className="mt-8 inline-flex min-h-14 items-center rounded-full bg-[var(--lime)] px-7 font-black text-[var(--ink)]" href="/login">
            כניסה עם אימייל אחר
          </Link>
        </section>
      </main>
    );
  }

  const [accounts, connection, grants, params] = await Promise.all([
    auth.api.listUserAccounts({ headers: requestHeaders }),
    findGitHubConnection(session.user.id),
    listGitHubRepositoryGrants(authorization.entitlement.id),
    searchParams,
  ]);
  const linked = accounts.some((account) => account.providerId === "github");
  const grantsByRepository = new Map(grants.map((grant) => [grant.repository, grant]));
  const repositoryAccess = ACCESS_REPOSITORIES.map((repository) => {
    const slug = `${repository.owner}/${repository.repo}`;
    const grant = grantsByRepository.get(slug);
    return {
      id: repository.id,
      title: repository.title,
      slug,
      state: grant?.state ?? null,
      invitationUrl: grant?.invitationUrl ?? null,
    };
  });

  return (
    <ProductAccess
      userName={session.user.name}
      isAdmin={isAdminSession(session)}
      githubAccess={{
        configured: githubOAuthConfigured() && githubAppConfigured(),
        linked,
        login: connection?.githubLogin ?? null,
        repositories: repositoryAccess,
        shouldProvision: params.github === "connected",
        connectionError: params.github === "error",
      }}
    />
  );
}
