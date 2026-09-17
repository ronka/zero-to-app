BEGIN;

ALTER TABLE access_email_deliveries
  DROP CONSTRAINT IF EXISTS access_email_deliveries_kind_check;

ALTER TABLE access_email_deliveries
  ADD CONSTRAINT access_email_deliveries_kind_check
  CHECK (kind IN ('initial-access', 'login'));

COMMIT;
