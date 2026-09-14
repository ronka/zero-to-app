import { dispatchAccessEmail } from "@/lib/access/delivery";
import { persistGrowPurchase } from "@/lib/db";
import { handleGrowWebhook } from "@/lib/grow/webhook";

export async function POST(request: Request) {
  return handleGrowWebhook(request, persistGrowPurchase, dispatchAccessEmail);
}
