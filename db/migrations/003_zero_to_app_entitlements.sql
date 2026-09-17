BEGIN;

-- Rename in place to preserve buyer claims and GitHub repository grants.
UPDATE entitlements
SET entitlement_key = 'zero-to-app'
WHERE entitlement_key = 'zero-to-saas';

COMMIT;
