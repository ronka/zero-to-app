import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { isAdminSession } from "@/lib/admin/authorization";
import { auth } from "@/lib/auth";
import { listFeatureRequests } from "@/lib/db";

import { AdminPanel } from "./admin-panel";

export const metadata: Metadata = {
  title: "ניהול פניות",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  // No session: send them to sign in. Signed in but not the operator: the page
  // does not exist, rather than advertising that an admin panel is here.
  if (!session?.user) redirect("/login");
  if (!isAdminSession(session)) notFound();

  return <AdminPanel requests={await listFeatureRequests()} />;
}
