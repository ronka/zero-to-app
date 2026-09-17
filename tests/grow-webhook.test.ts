import assert from "node:assert/strict";
import test from "node:test";

import { authorizeAccess } from "../lib/access/authorization";
import { dispatchClaimedAccessEmail } from "../lib/access/dispatch";
import {
  MAGIC_LINK_GENERIC_RESPONSE,
  MAGIC_LINK_RATE_LIMIT_RESPONSE,
  magicLinkHttpResponse,
  requestBuyerMagicLink,
} from "../lib/access/request";
import { deliverMagicLinkEmail } from "../lib/access/email-message";
import {
  handleGrowWebhook,
  parseGrowRequest,
  validateGrowWebhook,
} from "../lib/grow/webhook";
import type { AccessEmailDelivery } from "../lib/access/types";

const PROCESS_TOKEN = "merchant-process-token";
const tokenForProcess = () => PROCESS_TOKEN;

function validPayload() {
  return {
    status: "1",
    data: {
      statusCode: "2",
      sum: "590",
      fullName: "ישראל ישראלי",
      payerPhone: "0501111111",
      payerEmail: "  Buyer@Example.com ",
      paymentDate: "14/09/26",
      transactionId: "tx-123",
      paymentLinkProcessId: "3992305",
      paymentLinkProcessToken: PROCESS_TOKEN,
      transactionToken: "must-not-be-retained",
      cardSuffix: "1234",
      productData: [{ product_id: "842436", quantity: "1" }],
    },
  };
}

function requestFor(payload = validPayload(), contentType = "application/json") {
  return new Request("https://example.com/api/webhooks/grow", {
    method: "POST",
    headers: { "content-type": contentType },
    body: contentType === "application/json" ? JSON.stringify(payload) : String(payload),
  });
}

const delivery: AccessEmailDelivery = {
  id: "delivery-1",
  kind: "initial-access",
  callbackPath: "/access",
  payerEmail: "buyer@example.com",
  payerName: "ישראל ישראלי",
  productName: "Zero to App",
};

test("parses and verifies a JSON webhook without retaining sensitive fields", async () => {
  const purchase = validateGrowWebhook(
    await parseGrowRequest(requestFor()),
    tokenForProcess,
  );

  assert.deepEqual(purchase, {
    callbackPath: "/access",
    chargedTotal: "590",
    items: [{ entitlementKey: "zero-to-app", productId: "842436", quantity: 1 }],
    payerEmail: "buyer@example.com",
    payerName: "ישראל ישראלי",
    paymentDate: "14/09/26",
    processId: "3992305",
    productName: "Zero to App",
    providerTransactionId: "tx-123",
  });
  assert.equal(JSON.stringify(purchase).includes("must-not-be-retained"), false);
  assert.equal(JSON.stringify(purchase).includes("1234"), false);
  assert.equal(JSON.stringify(purchase).includes("0501111111"), false);
});

test("parses nested form-encoded product data", async () => {
  const data = validPayload().data;
  const body = new URLSearchParams({
    status: "1",
    "data[statusCode]": data.statusCode,
    "data[sum]": data.sum,
    "data[fullName]": data.fullName,
    "data[payerEmail]": data.payerEmail,
    "data[transactionId]": data.transactionId,
    "data[paymentLinkProcessId]": data.paymentLinkProcessId,
    "data[paymentLinkProcessToken]": data.paymentLinkProcessToken,
    "data[productData][0][product_id]": data.productData[0].product_id,
    "data[productData][0][quantity]": data.productData[0].quantity,
  });
  const request = new Request("https://example.com/api/webhooks/grow", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  assert.equal(
    validateGrowWebhook(await parseGrowRequest(request), tokenForProcess).items[0].productId,
    "842436",
  );
});

test("rejects unpaid, unverified, unknown, identifier-less, and non-exact bundles", () => {
  const cases = [
    { ...validPayload(), status: "0" },
    { ...validPayload(), data: { ...validPayload().data, statusCode: "1" } },
    { ...validPayload(), data: { ...validPayload().data, paymentLinkProcessToken: "wrong" } },
    { ...validPayload(), data: { ...validPayload().data, paymentLinkProcessId: "other" } },
    { ...validPayload(), data: { ...validPayload().data, payerEmail: "not-an-email" } },
    {
      ...validPayload(),
      data: { ...validPayload().data, transactionId: undefined, asmachta: undefined },
    },
    { ...validPayload(), data: { ...validPayload().data, productData: [] } },
    {
      ...validPayload(),
      data: {
        ...validPayload().data,
        productData: [{ product_id: "842436", quantity: "2" }],
      },
    },
  ];

  for (const payload of cases) {
    assert.throws(() => validateGrowWebhook(payload, tokenForProcess));
  }
});

test("fulfills before dispatch and treats duplicate delivery as success", async () => {
  const events: string[] = [];
  let calls = 0;
  const persist = async () => {
    events.push("persist");
    calls += 1;
    return { inserted: calls === 1, delivery: calls === 1 ? delivery : null };
  };
  const dispatch = async () => {
    events.push("dispatch");
  };

  const first = await handleGrowWebhook(requestFor(), persist, dispatch, tokenForProcess);
  const retry = await handleGrowWebhook(requestFor(), persist, dispatch, tokenForProcess);

  assert.deepEqual(events, ["persist", "dispatch", "persist"]);
  assert.deepEqual(await first.json(), { ok: true, duplicate: false, emailQueued: true });
  assert.deepEqual(await retry.json(), { ok: true, duplicate: true, emailQueued: false });
});

test("email failure never rolls back durable fulfillment", async () => {
  let persisted = false;
  const response = await handleGrowWebhook(
    requestFor(),
    async () => {
      persisted = true;
      return { inserted: true, delivery };
    },
    async () => {
      assert.equal(persisted, true);
      throw new Error("provider unavailable");
    },
    tokenForProcess,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, duplicate: false, emailQueued: false });
});

test("concurrent delivery claims send at most one access email", async () => {
  let available = true;
  let sent = 0;
  const dependencies = {
    claim: async () => {
      if (!available) return null;
      available = false;
      return delivery;
    },
    send: async () => {
      sent += 1;
    },
    markFailed: async () => {},
  };

  const results = await Promise.all([
    dispatchClaimedAccessEmail(delivery, dependencies),
    dispatchClaimedAccessEmail(delivery, dependencies),
  ]);
  assert.equal(sent, 1);
  assert.deepEqual(results.sort(), [false, true]);
});

test("public resend is enumeration-safe, rate-limited, and entitlement-gated", async () => {
  let queued = 0;
  let dispatched = 0;
  const dependencies = {
    secret: "rate-limit-secret",
    consumeRateLimit: async () => true,
    queue: async (email: string) => {
      if (email !== "buyer@example.com") return null;
      queued += 1;
      return delivery;
    },
    dispatch: async () => {
      dispatched += 1;
    },
  };

  const buyer = await requestBuyerMagicLink(
    { email: " Buyer@Example.com ", ip: "127.0.0.1", website: "" },
    dependencies,
  );
  const stranger = await requestBuyerMagicLink(
    { email: "stranger@example.com", ip: "127.0.0.1", website: "" },
    dependencies,
  );
  const limited = await requestBuyerMagicLink(
    { email: "buyer@example.com", ip: "127.0.0.1", website: "" },
    { ...dependencies, consumeRateLimit: async () => false },
  );

  assert.deepEqual(buyer, { body: MAGIC_LINK_GENERIC_RESPONSE, status: 200 });
  assert.deepEqual(stranger, { body: MAGIC_LINK_GENERIC_RESPONSE, status: 200 });
  assert.deepEqual(limited, { body: MAGIC_LINK_RATE_LIMIT_RESPONSE, status: 429 });
  const limitedResponse = magicLinkHttpResponse(limited);
  assert.equal(limitedResponse.status, 429);
  assert.equal(limitedResponse.headers.get("retry-after"), "900");
  assert.deepEqual(await limitedResponse.json(), MAGIC_LINK_RATE_LIMIT_RESPONSE);
  assert.equal(queued, 1);
  assert.equal(dispatched, 1);
});

test("purchase and login magic links use accurate, distinct copy", async () => {
  const messages: Array<{ subject: string; text: string; html: string }> = [];
  const dependencies = {
    from: "Zero to App <access@zerotoapp.co.il>",
    provider: {
      send: async (message: {
        subject: string;
        text: string;
        html: string;
      }) => {
        messages.push(message);
        return { data: { id: `message-${messages.length}` }, error: null };
      },
    },
    markSent: async () => {},
  };

  await deliverMagicLinkEmail(
    {
      email: "buyer@example.com",
      url: "https://example.com/api/auth/magic-link/verify?token=initial",
      metadata: {
        deliveryId: "initial-delivery",
        deliveryKind: "initial-access",
        productName: "Zero to App",
      },
    },
    dependencies,
  );
  await deliverMagicLinkEmail(
    {
      email: "buyer@example.com",
      url: "https://example.com/api/auth/magic-link/verify?token=login",
      metadata: {
        deliveryId: "login-delivery",
        deliveryKind: "login",
        productName: "Zero to App",
      },
    },
    dependencies,
  );

  assert.match(messages[0].subject, /גישה/);
  assert.match(messages[0].text, /התשלום התקבל/);
  assert.match(messages[0].html, /התשלום התקבל/);
  assert.match(messages[1].subject, /כניסה/);
  assert.doesNotMatch(messages[1].text, /תשלום|רכישה/);
  assert.doesNotMatch(messages[1].html, /תשלום|רכישה/);
});

test("Resend returned errors are delivery failures and the copy matches expiry", async () => {
  let marked = false;
  await assert.rejects(
    deliverMagicLinkEmail(
      {
        email: "buyer@example.com",
        url: "https://example.com/api/auth/magic-link/verify?token=secret",
        metadata: {
          deliveryId: "delivery-1",
          deliveryKind: "initial-access",
          productName: "Zero to App",
        },
      },
      {
        from: "Zero to App <access@zerotoapp.co.il>",
        provider: {
          send: async (message) => {
            assert.match(message.text, /15 דקות/);
            return { data: null, error: { message: "rejected" } };
          },
        },
        markSent: async () => {
          marked = true;
        },
      },
    ),
    /rejected/,
  );
  assert.equal(marked, false);
});

test("authorization denies anonymous, unverified, non-buyers, and the wrong product", async () => {
  const dependencies = {
    findEntitlement: async (_email: string, key: string) =>
      key === "zero-to-app" ? { id: "entitlement-1" } : null,
    claim: async () => true,
  };
  const buyer = {
    user: { id: "user-1", email: " BUYER@example.com ", emailVerified: true },
  };

  assert.equal((await authorizeAccess(null, "zero-to-app", dependencies)).status, "anonymous");
  assert.equal(
    (
      await authorizeAccess(
        { user: { ...buyer.user, emailVerified: false } },
        "zero-to-app",
        dependencies,
      )
    ).status,
    "unverified",
  );
  assert.equal((await authorizeAccess(buyer, "another-product", dependencies)).status, "denied");
  assert.equal((await authorizeAccess(buyer, "zero-to-app", dependencies)).status, "granted");
});
