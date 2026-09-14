import { Resend } from "resend";

import { markAccessEmailSent } from "./db";
import {
  deliverMagicLinkEmail,
  type MagicLinkMessage,
} from "./access/email-message";

export { MAGIC_LINK_EXPIRES_IN_SECONDS } from "./access/email-message";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export async function sendMagicLinkEmail(message: MagicLinkMessage) {
  const resend = new Resend(requiredEnv("RESEND_API_KEY"));
  return deliverMagicLinkEmail(message, {
    provider: { send: (email) => resend.emails.send(email) },
    from: requiredEnv("ACCESS_EMAIL_FROM"),
    markSent: markAccessEmailSent,
  });
}
