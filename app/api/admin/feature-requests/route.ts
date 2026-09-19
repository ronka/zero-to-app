import { headers } from "next/headers";

import { isAdminSession, parseStatusUpdate } from "@/lib/admin/authorization";
import { auth } from "@/lib/auth";
import { updateFeatureRequestStatus } from "@/lib/db";

export async function POST(request: Request) {
  // The /admin page gate does not protect this route; re-check before reading the body.
  const session = await auth.api.getSession({ headers: await headers() });
  // 404 rather than 403, and with no message: the panel does not announce itself
  // to a probing buyer, and the client renders its own Hebrew fallback instead.
  if (!isAdminSession(session)) {
    return Response.json({ ok: false }, { status: 404 });
  }

  let payload: { id: unknown; status: unknown; note?: unknown };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return Response.json({ ok: false, message: "בקשה לא תקינה." }, { status: 400 });
  }

  const update = parseStatusUpdate(payload);
  if (!update) {
    return Response.json({ ok: false, message: "סטטוס או מזהה לא תקינים." }, { status: 400 });
  }

  const record = await updateFeatureRequestStatus(update.id, update.status, update.note);
  if (!record) {
    return Response.json({ ok: false, message: "הפנייה לא נמצאה." }, { status: 404 });
  }
  return Response.json({ ok: true, request: record });
}
