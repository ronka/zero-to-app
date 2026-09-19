import assert from "node:assert/strict";
import test from "node:test";

import {
  FEATURE_REQUEST_HOURLY_LIMIT,
  featureRequestHttpResponse,
  submitFeatureRequest,
  type FeatureRequestInput,
} from "../lib/feedback/request";
import type { FeatureRequestInsert } from "../lib/feedback/types";

const identity = {
  userId: "user-1",
  entitlementId: "00000000-0000-0000-0000-000000000001",
  subjectEmail: "buyer@example.com",
};

function harness(recent = 0) {
  const inserted: FeatureRequestInsert[] = [];
  const counted: string[] = [];
  return {
    inserted,
    counted,
    dependencies: {
      countRecent: async (userId: string) => {
        counted.push(userId);
        return recent;
      },
      insert: async (request: FeatureRequestInsert) => {
        inserted.push(request);
      },
    },
  };
}

const valid: FeatureRequestInput = {
  kind: "feature",
  target: "web",
  title: "תמיכה בתשלומים חוזרים",
  body: "אשמח שהתבנית תתמוך במנויים חודשיים מתוך ההתקנה הראשונית.",
};

test("a valid submission inserts once with the trusted identity", async () => {
  const { inserted, dependencies } = harness();
  const result = await submitFeatureRequest(valid, identity, dependencies);

  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(inserted.length, 1);
  assert.deepEqual(inserted[0], {
    ...identity,
    kind: "feature",
    target: "web",
    title: valid.title,
    body: valid.body,
  });
});

test("identity always comes from the caller, never from the request body", async () => {
  const { inserted, dependencies } = harness();
  await submitFeatureRequest(
    { ...valid, userId: "attacker", entitlementId: "attacker" } as FeatureRequestInput,
    identity,
    dependencies,
  );

  assert.equal(inserted[0].userId, identity.userId);
  assert.equal(inserted[0].entitlementId, identity.entitlementId);
  assert.equal(inserted[0].subjectEmail, identity.subjectEmail);
});

test("each validation rule rejects with 400 and inserts nothing", async () => {
  const cases: FeatureRequestInput[] = [
    { ...valid, kind: "roadmap" },
    { ...valid, kind: undefined },
    { ...valid, target: "desktop" },
    { ...valid, target: null },
    { ...valid, title: "  אב  " },
    { ...valid, title: "א".repeat(121) },
    { ...valid, title: 42 },
    { ...valid, body: "קצר" },
    { ...valid, body: "א".repeat(4001) },
    { ...valid, body: undefined },
  ];

  for (const input of cases) {
    const { inserted, dependencies } = harness();
    const result = await submitFeatureRequest(input, identity, dependencies);
    assert.equal(result.status, 400, `expected 400 for ${JSON.stringify(input)}`);
    assert.equal(result.body.ok, false);
    assert.equal(inserted.length, 0);
  }
});

test("a filled honeypot looks like success and inserts nothing", async () => {
  const { inserted, counted, dependencies } = harness();
  const result = await submitFeatureRequest({ ...valid, website: "spam" }, identity, dependencies);

  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(inserted.length, 0);
  assert.equal(counted.length, 0);
});

test("an empty honeypot is treated as a real submission", async () => {
  const { inserted, dependencies } = harness();
  const result = await submitFeatureRequest({ ...valid, website: "" }, identity, dependencies);

  assert.equal(result.status, 200);
  assert.equal(inserted.length, 1);
});

test("submissions over the hourly cap return 429 and insert nothing", async () => {
  const { inserted, dependencies } = harness(FEATURE_REQUEST_HOURLY_LIMIT);
  const result = await submitFeatureRequest(valid, identity, dependencies);

  assert.equal(result.status, 429);
  assert.equal(result.body.ok, false);
  assert.equal(inserted.length, 0);
});

test("the last submission under the cap still goes through", async () => {
  const { inserted, dependencies } = harness(FEATURE_REQUEST_HOURLY_LIMIT - 1);
  const result = await submitFeatureRequest(valid, identity, dependencies);

  assert.equal(result.status, 200);
  assert.equal(inserted.length, 1);
});

test("control characters are stripped and newlines survive only in the body", async () => {
  const { inserted, dependencies } = harness();
  const nul = String.fromCharCode(0);
  const bell = String.fromCharCode(7);
  await submitFeatureRequest(
    {
      ...valid,
      title: `  נושא${nul} עם\nשבירה  `,
      body: `שורה ראשונה\r\nשורה שנייה${bell} עם פעמון`,
    },
    identity,
    dependencies,
  );

  assert.equal(inserted[0].title, "נושא עםשבירה");
  assert.equal(inserted[0].body, "שורה ראשונה\nשורה שנייה עם פעמון");
});

test("the rate limit response carries a Retry-After header", async () => {
  const { dependencies } = harness(FEATURE_REQUEST_HOURLY_LIMIT);
  const result = await submitFeatureRequest(valid, identity, dependencies);
  const response = featureRequestHttpResponse(result);

  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "3600");
});

test("multi-byte characters survive control-character stripping", async () => {
  const { inserted, dependencies } = harness();
  await submitFeatureRequest(
    { ...valid, title: "תמיכה ב־RTL 🎉", body: "אשמח לראות את זה בקרוב 🚀 מאוד" },
    identity,
    dependencies,
  );

  assert.equal(inserted[0].title, "תמיכה ב־RTL 🎉");
  assert.equal(inserted[0].body, "אשמח לראות את זה בקרוב 🚀 מאוד");
});
