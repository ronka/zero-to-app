export type AccessEmailDeliveryKind = "initial-access" | "login";

export type AccessEmailDelivery = {
  id: string;
  kind: AccessEmailDeliveryKind;
  payerEmail: string;
  payerName: string;
  callbackPath: string;
  productName: string;
};
