# Zero to App

Hebrew landing page and paid buyer portal for the Zero to App Web and Mobile templates.

## Purchase and access lifecycle

The site is buyer-only:

1. Grow sends a PaymentLinks notification to `POST /api/webhooks/grow`.
2. The server verifies paid statuses, process `3992305`, its configured process token, and the exact product bundle (`842436`, quantity `1`).
3. One database transaction stores the purchase, item, legacy-stable `zero-to-saas` entitlement, and pending email delivery.
4. After commit, Better Auth creates a 15-minute, single-use, hashed magic-link token and Resend sends it.
5. Redeeming the link creates or signs in the Better Auth user and redirects to `/access`.
6. `/access` checks the verified server session and an active entitlement for the normalized session email before exposing repository links.
7. The buyer explicitly connects GitHub. A narrowly installed GitHub App grants `pull` access to both template repositories; the buyer accepts GitHub's invitations and the portal rechecks them.

Duplicate Grow notifications do not duplicate purchases or entitlements. Email failure does not roll back access and can be retried from `/thank-you` or `/login`. The public resend response is generic, entitlement-gated, honeypot-protected, and limited to three attempts per IP/email pair per 15-minute database window.

## Local setup

Copy `.env.example` to `.env.local` and configure all required values. Then apply the database migrations in order and run the app:

```bash
node --env-file=.env.local --input-type=module -e 'import { readFileSync } from "node:fs"; import pg from "pg"; const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL }); for (const file of ["db/migrations/001_grow_purchases.sql", "db/migrations/002_github_access.sql"]) await pool.query(readFileSync(file, "utf8")); await pool.end();'
npm run dev
```

`ACCESS_WEB_REPO_URL` and `ACCESS_MOBILE_REPO_URL` are optional during development. They are read only on the authorized server page and should point to the actual buyer delivery destinations in production.

## GitHub App setup

Create one GitHub App under the account or organization that owns the two template repositories.

- Set the callback URL to `https://zerotoapp.co.il/api/auth/callback/github` and add the localhost equivalent for local testing. Disable callback wildcard matching.
- Disable webhooks and device flow. Do not enable **Request user authorization during installation**; buyers authorize from the portal and never install the app.
- Set repository permission **Administration** to **Read and write** and user permission **Email addresses** to **Read-only**. Leave Contents and all other permissions at **No access**. Better Auth needs the email permission because a GitHub account may keep its primary email private.
- Install the app on the repository owner and select only the two template repositories.
- Generate a private key, then set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_APP_ID`, `GITHUB_APP_INSTALLATION_ID`, and `GITHUB_APP_PRIVATE_KEY` in the deployment environment. A one-line private key may use literal `\n` separators.
- Keep expiring user authorization tokens enabled. Better Auth encrypts OAuth tokens at rest using `BETTER_AUTH_SECRET`.

The installation needs Administration write because GitHub protects collaborator management with that permission. Buyers still receive only `pull` access and cannot push to the source templates. GitHub sends an invitation for an outside collaborator; after accepting it, the buyer returns to `/access` and selects **בדיקת גישה מחדש**.

For local OAuth, set `BETTER_AUTH_URL=http://localhost:3000`, add `http://localhost:3000/api/auth/callback/github` to the app, and use repositories that are safe to invite test accounts into.

## Production setup

These provider-side steps require a human account owner:

- Ask Grow support to enable the PaymentLinks webhook for process `3992305` and set it to `https://zerotoapp.co.il/api/webhooks/grow`.
- Capture the `paymentLinkProcessToken` from a verified Grow server notification and set `GROW_PAYMENT_LINK_PROCESS_TOKEN`. Confirm with Grow whether this merchant flow also requires the separate Approve Transaction API; if it does, add the merchant credentials and acknowledgement before launch.
- Set the payment link success URL to `https://zerotoapp.co.il/thank-you` and failure/cancellation URL to `https://zerotoapp.co.il/`.
- Verify the sending domain in Resend, publish its DNS records, and set `RESEND_API_KEY` and `ACCESS_EMAIL_FROM` to that domain.
- Set production `BETTER_AUTH_URL`, a strong `BETTER_AUTH_SECRET`, `DATABASE_URL`, and the two protected repository URLs.
- Configure and install the GitHub App as described above. Check the GitHub plan's outside-collaborator seat cost and repository invitation rate limit before launch.
- Apply `db/migrations/001_grow_purchases.sql` and then `db/migrations/002_github_access.sql` before deploying the application.
- Make one real low-value purchase and observe: webhook acceptance, one purchase and entitlement, email receipt, first-user creation, redirect to `/access`, existing-user login, and denial from another email. Then test expiry and fallback resend.
- With that buyer, connect a GitHub account whose email differs from the purchase email, verify both invitations are read-only, accept them, recheck the portal, and confirm both template and clone controls unlock.

Do not treat a mocked webhook as production verification. Grow's browser redirect is not proof of payment; `/thank-you` remains pending briefly and never grants access.

## Checks

```bash
npm test
npm run lint
npm run build
```

Unit coverage includes JSON/form Grow payloads, payment/token/bundle validation, email-after-commit ordering, idempotent retry behavior, recoverable Resend errors, generic/rate-limited fallback requests, email normalization, and server authorization outcomes. The real purchase checklist above covers provider-owned behavior that cannot be proven with mocks.
