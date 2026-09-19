export const FEATURE_REQUEST_KINDS = ["feature", "bug", "feedback"] as const;
export const FEATURE_REQUEST_TARGETS = ["web", "mobile", "both", "site"] as const;

export type FeatureRequestKind = (typeof FEATURE_REQUEST_KINDS)[number];
export type FeatureRequestTarget = (typeof FEATURE_REQUEST_TARGETS)[number];

export const FEATURE_REQUEST_TITLE_LIMITS = { minimum: 3, maximum: 120 } as const;
export const FEATURE_REQUEST_BODY_LIMITS = { minimum: 10, maximum: 4000 } as const;

/** Resolved server-side from the session and entitlement, never from the request body. */
export type FeatureRequestIdentity = {
  userId: string;
  entitlementId: string;
  subjectEmail: string;
};

export type FeatureRequestInsert = FeatureRequestIdentity & {
  kind: FeatureRequestKind;
  target: FeatureRequestTarget;
  title: string;
  body: string;
};
