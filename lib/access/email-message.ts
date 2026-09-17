export const MAGIC_LINK_EXPIRES_IN_SECONDS = 15 * 60;

export type MagicLinkMessage = {
  email: string;
  url: string;
  metadata?: Record<string, unknown>;
};

export type EmailProvider = {
  send: (message: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  }) => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function deliverMagicLinkEmail(
  { email, url, metadata }: MagicLinkMessage,
  dependencies: {
    provider: EmailProvider;
    from: string;
    markSent: (deliveryId: string, providerMessageId: string) => Promise<void>;
  },
) {
  const deliveryId = typeof metadata?.deliveryId === "string" ? metadata.deliveryId : null;
  if (!deliveryId) throw new Error("Tracked delivery ID is required");
  const deliveryKind = metadata?.deliveryKind;
  if (deliveryKind !== "initial-access" && deliveryKind !== "login") {
    throw new Error("Tracked delivery kind is required");
  }

  const productName =
    typeof metadata?.productName === "string" ? metadata.productName : "Zero to App";
  const minutes = MAGIC_LINK_EXPIRES_IN_SECONDS / 60;
  const safeUrl = escapeHtml(url);
  const safeProductName = escapeHtml(productName);
  const content =
    deliveryKind === "initial-access"
      ? {
          subject: `הגישה שלך ל־${productName}`,
          text: `התשלום התקבל. הקישור ליצירת חשבון או התחברות ל־${productName}: ${url}\n\nהקישור תקף ל־${minutes} דקות וניתן לשימוש פעם אחת.`,
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.7;max-width:560px;margin:auto">
      <h1 style="font-size:24px">התשלום התקבל — הגישה מוכנה</h1>
      <p>לחצו על הכפתור כדי ליצור חשבון או להתחבר ל־${safeProductName}.</p>
      <p><a href="${safeUrl}" style="display:inline-block;background:#c7ff4a;color:#111;padding:12px 22px;border-radius:999px;font-weight:700;text-decoration:none">כניסה לתוכן</a></p>
      <p style="color:#666;font-size:14px">הקישור תקף ל־${minutes} דקות וניתן לשימוש פעם אחת.</p>
    </div>`,
        }
      : {
          subject: `קישור הכניסה שלך ל־${productName}`,
          text: `הנה קישור הכניסה שלך ל־${productName}: ${url}\n\nהקישור תקף ל־${minutes} דקות וניתן לשימוש פעם אחת.`,
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.7;max-width:560px;margin:auto">
      <h1 style="font-size:24px">קישור הכניסה שלך מוכן</h1>
      <p>לחצו על הכפתור כדי להתחבר ל־${safeProductName}.</p>
      <p><a href="${safeUrl}" style="display:inline-block;background:#c7ff4a;color:#111;padding:12px 22px;border-radius:999px;font-weight:700;text-decoration:none">כניסה לתוכן</a></p>
      <p style="color:#666;font-size:14px">הקישור תקף ל־${minutes} דקות וניתן לשימוש פעם אחת.</p>
    </div>`,
        };
  const { data, error } = await dependencies.provider.send({
    from: dependencies.from,
    to: email,
    ...content,
  });

  if (error) throw new Error(`Resend rejected the access email: ${error.message}`);
  if (!data?.id) throw new Error("Resend did not return a message ID");
  await dependencies.markSent(deliveryId, data.id);
}
