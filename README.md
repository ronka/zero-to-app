# Zero to SaaS

Hebrew landing page and paid buyer portal for the Zero to SaaS Web and Mobile templates.

## Purchase and access lifecycle

The site is buyer-only:

1. Grow sends a PaymentLinks notification to `POST /api/webhooks/grow`.
2. The server verifies paid statuses, process `3992305`, its configured process token, and the exact product bundle (`842436`, quantity `1`).
3. One database transaction stores the purchase, item, `zero-to-saas` entitlement, and pending email delivery.
4. After commit, Better Auth creates a 15-minute, single-use, hashed magic-link token and Resend sends it.
5. Redeeming the link creates or signs in the Better Auth user and redirects to `/access`.
6. `/access` checks the verified server session and an active entitlement for the normalized session email before exposing repository links.

Duplicate Grow notifications do not duplicate purchases or entitlements. Email failure does not roll back access and can be retried from `/thank-you` or `/login`. The public resend response is generic, entitlement-gated, honeypot-protected, and limited to three attempts per IP/email pair per 15-minute database window.

## Local setup

Copy `.env.example` to `.env.local` and configure all required values. Then apply the database migration and run the app:

```bash
node --env-file=.env.local --input-type=module -e 'import { readFileSync } from "node:fs"; import pg from "pg"; const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL }); await pool.query(readFileSync("db/migrations/001_grow_purchases.sql", "utf8")); await pool.end();'
npm run dev
```

`ACCESS_WEB_REPO_URL` and `ACCESS_MOBILE_REPO_URL` are optional during development. They are read only on the authorized server page and should point to the actual buyer delivery destinations in production.

## Production setup

These provider-side steps require a human account owner:

- Ask Grow support to enable the PaymentLinks webhook for process `3992305` and set it to `https://YOUR_DOMAIN/api/webhooks/grow`.
- Capture the `paymentLinkProcessToken` from a verified Grow server notification and set `GROW_PAYMENT_LINK_PROCESS_TOKEN`. Confirm with Grow whether this merchant flow also requires the separate Approve Transaction API; if it does, add the merchant credentials and acknowledgement before launch.
- Set the payment link success URL to `https://YOUR_DOMAIN/thank-you` and failure/cancellation URL to the public sales page.
- Verify the sending domain in Resend, publish its DNS records, and set `RESEND_API_KEY` and `ACCESS_EMAIL_FROM` to that domain.
- Set production `BETTER_AUTH_URL`, a strong `BETTER_AUTH_SECRET`, `DATABASE_URL`, and the two protected repository URLs.
- Apply `db/migrations/001_grow_purchases.sql` before deploying the application.
- Make one real low-value purchase and observe: webhook acceptance, one purchase and entitlement, email receipt, first-user creation, redirect to `/access`, existing-user login, and denial from another email. Then test expiry and fallback resend.

Do not treat a mocked webhook as production verification. Grow's browser redirect is not proof of payment; `/thank-you` remains pending briefly and never grants access.

## Checks

```bash
npm test
npm run lint
npm run build
```

Unit coverage includes JSON/form Grow payloads, payment/token/bundle validation, email-after-commit ordering, idempotent retry behavior, recoverable Resend errors, generic/rate-limited fallback requests, email normalization, and server authorization outcomes. The real purchase checklist above covers provider-owned behavior that cannot be proven with mocks.
