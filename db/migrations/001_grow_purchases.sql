BEGIN;

-- Better Auth core schema. Names match its default PostgreSQL/Kysely adapter.
CREATE TABLE IF NOT EXISTS "user" (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  image text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS session (
  id text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  "expiresAt" timestamptz NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS session_user_id_idx ON session ("userId");

CREATE TABLE IF NOT EXISTS account (
  id text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope text,
  password text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS account_user_id_idx ON account ("userId");

CREATE TABLE IF NOT EXISTS verification (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification (identifier);

CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider = 'grow'),
  provider_transaction_id text NOT NULL,
  payment_link_process_id text NOT NULL,
  payer_email text NOT NULL,
  payer_name text NOT NULL,
  charged_total numeric(12, 2) NOT NULL CHECK (charged_total > 0),
  currency text NOT NULL CHECK (currency = 'ILS'),
  provider_payment_date text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_transaction_id)
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES purchases(id) ON DELETE RESTRICT,
  provider_product_id text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  UNIQUE (purchase_id, provider_product_id)
);

-- Backfill the earlier one-product schema before removing its redundant columns.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'purchases'
      AND column_name = 'provider_product_id'
  ) THEN
    INSERT INTO purchase_items (purchase_id, provider_product_id, quantity)
    SELECT id, provider_product_id, quantity FROM purchases
    ON CONFLICT (purchase_id, provider_product_id) DO NOTHING;
  END IF;
END $$;

ALTER TABLE purchases
  DROP COLUMN IF EXISTS provider_product_id,
  DROP COLUMN IF EXISTS payer_phone,
  DROP COLUMN IF EXISTS quantity;

CREATE TABLE IF NOT EXISTS entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES purchases(id) ON DELETE RESTRICT,
  entitlement_key text NOT NULL,
  subject_email text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  claimed_user_id text REFERENCES "user"(id) ON DELETE SET NULL,
  claimed_at timestamptz
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'entitlements'
      AND column_name = 'created_at'
  ) THEN
    ALTER TABLE entitlements RENAME COLUMN created_at TO granted_at;
  END IF;
END $$;

ALTER TABLE entitlements
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS claimed_user_id text REFERENCES "user"(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz;
ALTER TABLE entitlements DROP CONSTRAINT IF EXISTS entitlements_purchase_id_key;
ALTER TABLE entitlements
  DROP CONSTRAINT IF EXISTS entitlements_entitlement_key_subject_email_purchase_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS entitlements_purchase_entitlement_unique
  ON entitlements (purchase_id, entitlement_key);
CREATE INDEX IF NOT EXISTS entitlements_subject_lookup
  ON entitlements (subject_email, entitlement_key)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS access_email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES purchases(id) ON DELETE RESTRICT,
  kind text NOT NULL CHECK (kind IN ('initial-access')),
  state text NOT NULL CHECK (state IN ('pending', 'sending', 'sent', 'failed')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_attempt_at timestamptz,
  sent_at timestamptz,
  provider_message_id text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (purchase_id, kind)
);

CREATE TABLE IF NOT EXISTS magic_link_rate_limits (
  fingerprint text NOT NULL,
  window_started_at timestamptz NOT NULL,
  attempts integer NOT NULL CHECK (attempts > 0),
  PRIMARY KEY (fingerprint, window_started_at)
);

COMMIT;
