import assert from "node:assert/strict";
import test from "node:test";

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
