import assert from "node:assert/strict";
import test from "node:test";

import Database from "better-sqlite3";
import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db/migration";
import { magicLink } from "better-auth/plugins";

test("a magic link creates the first buyer, verifies email, and signs in an existing buyer", async () => {
  const database = new Database(":memory:");
  const sent: Array<{ email: string; token: string; url: string }> = [];
  const testAuth = betterAuth({
    database,
    baseURL: "http://localhost:3000",
    secret: "a-test-secret-that-is-at-least-thirty-two-bytes",
    plugins: [
      magicLink({
        disableSignUp: false,
        expiresIn: 900,
        storeToken: "hashed",
        sendMagicLink: async ({ email, token, url }) => {
          sent.push({ email, token, url });
        },
      }),
    ],
  });
  const { runMigrations } = await getMigrations(testAuth.options);
  await runMigrations();
  const headers = new Headers({ origin: "http://localhost:3000" });

  await testAuth.api.signInMagicLink({
    body: {
      email: "buyer@example.com",
      name: "Buyer",
      callbackURL: "/access",
      errorCallbackURL: "/auth/error",
    },
    headers,
  });
  assert.equal(sent.length, 1);
  assert.match(sent[0].url, /callbackURL=%2Faccess/);

  const firstSession = await testAuth.api.magicLinkVerify({
    query: { token: sent[0].token },
    headers,
  });
  assert.equal(firstSession.user.email, "buyer@example.com");
  assert.equal(firstSession.user.emailVerified, true);

  await assert.rejects(
    testAuth.api.magicLinkVerify({ query: { token: sent[0].token }, headers }),
  );

  await testAuth.api.signInMagicLink({
    body: { email: "buyer@example.com", callbackURL: "/access" },
    headers,
  });
  const existingSession = await testAuth.api.magicLinkVerify({
    query: { token: sent[1].token },
    headers,
  });
  assert.equal(existingSession.user.id, firstSession.user.id);
  assert.notEqual(existingSession.session.id, firstSession.session.id);

  database.close();
});
