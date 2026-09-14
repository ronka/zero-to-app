import { toNextJsHandler } from "better-auth/next-js";

import { handlePublicMagicLinkRequest } from "@/lib/access/delivery";
import { auth } from "@/lib/auth";

const handlers = toNextJsHandler(auth);

export const GET = handlers.GET;

export async function POST(request: Request) {
  if (new URL(request.url).pathname.endsWith("/sign-in/magic-link")) {
    return handlePublicMagicLinkRequest(request);
  }
  return handlers.POST(request);
}
