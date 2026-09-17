import { SITE_URL } from "./brand";

type AuthEnvironment = {
  BETTER_AUTH_URL?: string;
  NODE_ENV?: string;
};

export function authBaseUrl(environment: AuthEnvironment = process.env) {
  if (environment.NODE_ENV === "production") return SITE_URL.origin;

  const configured = environment.BETTER_AUTH_URL;
  if (!configured) throw new Error("BETTER_AUTH_URL is not configured");
  return new URL(configured).origin;
}
