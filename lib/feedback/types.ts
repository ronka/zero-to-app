export const FEATURE_REQUEST_KINDS = ["feature", "bug", "feedback"] as const;
export const FEATURE_REQUEST_TARGETS = ["web", "mobile", "both", "site"] as const;
// Must stay in step with the CHECK constraint in db/migrations/005_feature_requests.sql.
export const FEATURE_REQUEST_STATUSES = [
  "new",
  "triaged",
  "planned",
  "shipped",
  "declined",
] as const;

export type FeatureRequestKind = (typeof FEATURE_REQUEST_KINDS)[number];
export type FeatureRequestTarget = (typeof FEATURE_REQUEST_TARGETS)[number];
export type FeatureRequestStatus = (typeof FEATURE_REQUEST_STATUSES)[number];

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

export type FeatureRequestRecord = {
  id: string;
  kind: FeatureRequestKind;
  target: FeatureRequestTarget;
  title: string;
  body: string;
  status: FeatureRequestStatus;
  note: string | null;
  subjectEmail: string;
  createdAt: string;
  updatedAt: string;
};
