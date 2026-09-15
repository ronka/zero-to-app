BEGIN;

-- Better Auth identifies external accounts by the provider and provider subject.
CREATE UNIQUE INDEX IF NOT EXISTS account_provider_account_unique
  ON account ("providerId", "accountId");

CREATE TABLE IF NOT EXISTS github_connections (
  user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  better_auth_account_id text NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  github_account_id text NOT NULL UNIQUE,
  github_login text NOT NULL,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS github_repository_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entitlement_id uuid NOT NULL REFERENCES entitlements(id) ON DELETE RESTRICT,
  connection_user_id text NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  repository text NOT NULL,
  permission text NOT NULL CHECK (permission = 'pull'),
  state text NOT NULL CHECK (state IN ('provisioning', 'invited', 'active', 'failed', 'revoked')),
  invitation_id bigint,
  invitation_url text,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_attempt_at timestamptz,
  last_error text,
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entitlement_id, repository)
);

CREATE INDEX IF NOT EXISTS github_repository_grants_connection_idx
  ON github_repository_grants (connection_user_id);

COMMIT;
