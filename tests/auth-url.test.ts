import assert from "node:assert/strict";
import test from "node:test";

import nextConfig from "../next.config";
import { authBaseUrl } from "../lib/auth-url";

test("production authentication always uses the canonical site origin", () => {
  assert.equal(
    authBaseUrl({
      NODE_ENV: "production",
      BETTER_AUTH_URL: "https://zero-to-app-ten.vercel.app",
    }),
    "https://zerotoapp.co.il",
  );
});

test("development authentication uses the configured local origin", () => {
  assert.equal(
    authBaseUrl({ NODE_ENV: "development", BETTER_AUTH_URL: "http://localhost:3000/" }),
    "http://localhost:3000",
  );
});

test("alternate production hosts redirect to the canonical domain", async () => {
  const redirects = await nextConfig.redirects!();
  const redirectedHosts = redirects.flatMap((redirect) =>
    redirect.has?.filter((condition) => condition.type === "host").map((condition) => condition.value) ?? [],
  );

  assert.deepEqual(redirectedHosts, [
    "www.zerotoapp.co.il",
    "zero-to-app-ten.vercel.app",
  ]);
  assert.ok(
    redirects.every((redirect) => redirect.destination === "https://zerotoapp.co.il/:path*"),
  );
});
