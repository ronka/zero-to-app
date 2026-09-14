export const GROW_PAYMENT_URL =
  "https://pay.grow.link/ODY2MzU~3080f4232289502bf77a98ca45db8b5a-Mzk5MjQyMg";

export const GROW_PRODUCTS = {
  "3992305": {
    name: "תשתית מוכנה לאפליקציות",
    callbackPath: "/access",
    paymentLinkProcessTokenEnv: "GROW_PAYMENT_LINK_PROCESS_TOKEN",
    products: {
      "842436": {
        entitlementKey: "zero-to-saas",
        quantity: 1,
      },
    },
  },
} as const;

export type GrowProcessId = keyof typeof GROW_PRODUCTS;
export type GrowProduct = (typeof GROW_PRODUCTS)[GrowProcessId];

export const ACCESS_CALLBACK_PATHS = [
  ...new Set(Object.values(GROW_PRODUCTS).map((product) => product.callbackPath)),
] as const;

export function productForEntitlement(entitlementKey: string) {
  for (const [processId, process] of Object.entries(GROW_PRODUCTS)) {
    if (
      Object.values(process.products).some(
        (product) => product.entitlementKey === entitlementKey,
      )
    ) {
      return { processId, ...process };
    }
  }

  return null;
}
