BEGIN;

-- Buyer-submitted feature requests, bug reports and general feedback.
-- Stored only; nothing notifies on insert. Triage by updating status/note.
CREATE TABLE IF NOT EXISTS feature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text REFERENCES "user"(id) ON DELETE SET NULL,
  entitlement_id uuid NOT NULL REFERENCES entitlements(id) ON DELETE RESTRICT,
  subject_email text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('feature', 'bug', 'feedback')),
  target text NOT NULL CHECK (target IN ('web', 'mobile', 'both', 'site')),
  title text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'triaged', 'planned', 'shipped', 'declined')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feature_requests_user_recent
  ON feature_requests (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS feature_requests_triage
  ON feature_requests (status, created_at DESC);

COMMIT;
