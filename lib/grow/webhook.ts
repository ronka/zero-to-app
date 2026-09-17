import { createHash, timingSafeEqual } from "node:crypto";

import type { AccessEmailDelivery } from "../access/types";
import { GROW_PRODUCTS, type GrowProcessId } from "./products";

type JsonRecord = Record<string, unknown>;

export type GrowPurchaseItem = {
  entitlementKey: string;
  productId: string;
  quantity: number;
};

export type GrowPurchase = {
  callbackPath: string;
  chargedTotal: string;
  items: GrowPurchaseItem[];
  payerEmail: string;
  payerName: string;
  paymentDate: string | null;
  processId: GrowProcessId;
  productName: string;
  providerTransactionId: string;
};

export type PersistGrowPurchaseResult = {
  inserted: boolean;
  delivery: AccessEmailDelivery | null;
};

export class InvalidGrowWebhookError extends Error {}
export class GrowWebhookConfigurationError extends Error {}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRequiredString(value: unknown, field: string): string {
  if ((typeof value !== "string" && typeof value !== "number") || String(value).trim() === "") {
    throw new InvalidGrowWebhookError(`Missing ${field}`);
  }

  return String(value).trim();
}

function keyPath(key: string): string[] {
  return key.replace(/\]/g, "").split("[").filter(Boolean);
}

function assignNested(target: JsonRecord, key: string, value: string) {
  const path = keyPath(key);
  let cursor = target;

  path.forEach((segment, index) => {
    if (index === path.length - 1) {
      cursor[segment] = value;
      return;
    }

    const next = cursor[segment];
    if (!isRecord(next)) cursor[segment] = {};
    cursor = cursor[segment] as JsonRecord;
  });
}

function objectArrays(value: unknown): unknown {
  if (!isRecord(value)) return value;

  const converted = Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, objectArrays(child)]),
  );
  const keys = Object.keys(converted);
  if (keys.length > 0 && keys.every((key) => /^\d+$/.test(key))) {
    return keys
      .sort((left, right) => Number(left) - Number(right))
      .map((key) => converted[key]);
  }

  return converted;
}

export function parseNestedForm(body: string): unknown {
  const result: JsonRecord = {};
  for (const [key, value] of new URLSearchParams(body)) {
    assignNested(result, key, value);
  }
  return objectArrays(result);
}

export async function parseGrowRequest(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  const body = await request.text();

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(body);
    } catch {
      throw new InvalidGrowWebhookError("Invalid JSON body");
    }
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return parseNestedForm(body);
  }

  throw new InvalidGrowWebhookError("Unsupported content type");
}

function normalizeProducts(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (isRecord(value)) return Object.values(value).filter(isRecord);
  throw new InvalidGrowWebhookError("Missing productData");
}

function safeTokenMatches(actual: string, expected: string) {
  const actualHash = createHash("sha256").update(actual).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

function configuredProcessToken(processId: GrowProcessId) {
  const envName = GROW_PRODUCTS[processId].paymentLinkProcessTokenEnv;
  const value = process.env[envName];
  if (!value) {
    throw new GrowWebhookConfigurationError(`${envName} is not configured`);
  }
  return value;
}

export function validateGrowWebhook(
  payload: unknown,
  processTokenFor: (processId: GrowProcessId) => string = configuredProcessToken,
): GrowPurchase {
  if (!isRecord(payload) || String(payload.status) !== "1" || !isRecord(payload.data)) {
    throw new InvalidGrowWebhookError("Payment was not successful");
  }

  const data = payload.data;
  if (String(data.statusCode) !== "2") {
    throw new InvalidGrowWebhookError("Payment was not paid");
  }

  const processId = asRequiredString(data.paymentLinkProcessId, "paymentLinkProcessId");
  const registry = GROW_PRODUCTS[processId as GrowProcessId];
  if (!registry) throw new InvalidGrowWebhookError("Unknown payment link process");

  const suppliedToken = asRequiredString(
    data.paymentLinkProcessToken,
    "paymentLinkProcessToken",
  );
  if (!safeTokenMatches(suppliedToken, processTokenFor(processId as GrowProcessId))) {
    throw new InvalidGrowWebhookError("Webhook verification failed");
  }

  const products = normalizeProducts(data.productData);
  const requiredProducts = Object.entries(registry.products);
  if (products.length !== requiredProducts.length) {
    throw new InvalidGrowWebhookError("Unexpected product bundle");
  }

  const seen = new Set<string>();
  const items: GrowPurchaseItem[] = [];

  for (const product of products) {
    const productId = asRequiredString(product.product_id, "product_id");
    const quantity = Number(asRequiredString(product.quantity, "quantity"));
    const expected = registry.products[productId as keyof typeof registry.products];

    if (!expected || !Number.isInteger(quantity) || quantity !== expected.quantity || seen.has(productId)) {
      throw new InvalidGrowWebhookError("Unexpected product or quantity");
    }

    seen.add(productId);
    items.push({ productId, quantity, entitlementKey: expected.entitlementKey });
  }

  if (requiredProducts.some(([productId]) => !seen.has(productId))) {
    throw new InvalidGrowWebhookError("Incomplete product bundle");
  }

  const payerEmail = asRequiredString(data.payerEmail, "payerEmail").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail)) {
    throw new InvalidGrowWebhookError("Invalid payerEmail");
  }

  const chargedTotal = asRequiredString(data.sum, "sum");
  if (!/^\d+(?:\.\d{1,2})?$/.test(chargedTotal) || Number(chargedTotal) <= 0) {
    throw new InvalidGrowWebhookError("Invalid charged total");
  }

  return {
    callbackPath: registry.callbackPath,
    chargedTotal,
    items,
    payerEmail,
    payerName: asRequiredString(data.fullName, "fullName"),
    paymentDate:
      typeof data.paymentDate === "string" && data.paymentDate.trim()
        ? data.paymentDate.trim()
        : null,
    processId: processId as GrowProcessId,
    productName: registry.name,
    providerTransactionId: asRequiredString(
      data.transactionId ?? data.asmachta,
      "transactionId or asmachta",
    ),
  };
}

export async function handleGrowWebhook(
  request: Request,
  persist: (purchase: GrowPurchase) => Promise<PersistGrowPurchaseResult>,
  dispatch: (delivery: AccessEmailDelivery) => Promise<void>,
  processTokenFor?: (processId: GrowProcessId) => string,
) {
  try {
    const payload = await parseGrowRequest(request);
    const purchase = validateGrowWebhook(payload, processTokenFor);
    const result = await persist(purchase);

    let emailQueued = false;
    if (result.delivery) {
      try {
        await dispatch(result.delivery);
        emailQueued = true;
      } catch {
        // Fulfillment has committed. A failed notification remains recoverable.
      }
    }

    return Response.json({
      ok: true,
      duplicate: !result.inserted,
      emailQueued,
    });
  } catch (error) {
    if (error instanceof InvalidGrowWebhookError) {
      return Response.json({ ok: false, error: "Invalid notification" }, { status: 400 });
    }
    throw error;
  }
}
