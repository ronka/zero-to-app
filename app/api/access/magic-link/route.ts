import { handlePublicMagicLinkRequest } from "@/lib/access/delivery";

export async function POST(request: Request) {
  return handlePublicMagicLinkRequest(request);
}
