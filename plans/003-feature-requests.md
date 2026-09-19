# Plan 003: Collect starter feature requests and feedback from buyers

> Executor: read this whole plan, then complete steps in order. There is nothing to confirm before starting.
>
> Note on the index: `plans/README.md` is titled "Publishing improvements" and its Order table covers only 001/002. This plan is not a publishing improvement, so **do not** add a row to that table. Either leave the index alone, or — if the user wants one general plan index — retitle `plans/README.md` first as a separate change. Do not silently widen it mid-implementation.

## Status and intent

- Priority P2; effort S (one focused session); risk LOW (no outbound calls, no new credentials); category direction.
- Planned 2026-09-19 against root `d347266`.
- User approved, 2026-09-19: **buyers only**, on `/access`; **store in Postgres only** — no notification of any kind.
- Result: a signed-in buyer with an active `zero-to-app` entitlement can submit a feature request, bug report, or general feedback from the buyer portal. It lands in one table. You read it by querying.
- Do not build a triage/admin UI, and do not add email or GitHub notification. Both were considered and deliberately dropped.

## Current state

- `app/access/page.tsx:26` already enforces session + `authorizeAccess(...)` + entitlement before rendering. The form lives inside that page, but the **API route must repeat the check server-side** — the page check does not protect the route.
- `app/api/access/magic-link/route.ts` is the route idiom: three lines delegating to a handler in `lib/`.
- `lib/access/request.ts` is the pure-handler idiom: `(input, dependencies) => {body, status}`, importing nothing from `lib/db` or `lib/auth`. That is what makes it testable — match it.
- `app/components/magic-link-form.tsx` is the form idiom: `"use client"`, `idle | sending | sent | error` state, `role="status"` / `role="alert"`, honeypot field, `min-h-14` controls, `var(--lime)` submit button, Hebrew copy.
- Migrations are applied **by hand** via the one-liner in `README.md:24`, which lists each file explicitly. Adding `005_...` without editing that line means it never runs in production.
- `tests/` uses `node:test` + `node:assert/strict` via `tsx --test`, covering pure functions with fake dependencies.

Before writing any code, read `node_modules/next/dist/docs/01-app/02-guides/forms.md` and `01-getting-started/15-route-handlers.md` as AGENTS.md requires. A Server Action would be the more idiomatic App Router choice for a form, but this repo consistently uses route handler + client `fetch`; **match the repo** unless those docs say that pattern is discouraged. Record what the docs said in the commit message.

## Scope

Allowed changes:

- `db/migrations/005_feature_requests.sql` (new).
- `lib/feedback/types.ts`, `lib/feedback/request.ts` (new).
- `lib/access/authorization.ts` — extract a read-only `readAccess` that `authorizeAccess` then builds on.
- `lib/db.ts` — two new exported functions (`insertFeatureRequest`, `countRecentFeatureRequests`).
- `app/api/feedback/route.ts` (new).
- `app/access/feedback-form.tsx` (new), rendered from `app/access/product-access.tsx`.
- `tests/feature-request.test.ts` (new); `tests/grow-webhook.test.ts` gains a `readAccess` case.
- `README.md` — the migration one-liner, plus a short "reading feedback" note.

Out of scope: any notification path (email, GitHub issue, webhook), admin/triage UI, public non-buyer submission, voting or upvotes, file/screenshot uploads, editing or withdrawing a submission, changes to the starter repos or the generator, and any change to `lib/github/` or `lib/email.ts`.

## Data model

Conventions verified against `001_grow_purchases.sql`: `BEGIN; … COMMIT;`, `CREATE TABLE IF NOT EXISTS`, `uuid PRIMARY KEY DEFAULT gen_random_uuid()` for owned tables, `"user"(id)` is **`text`** (better-auth), real foreign keys with `ON DELETE RESTRICT` for records that must survive and `ON DELETE SET NULL` for the buyer link (as `entitlements.claimed_user_id` does), inline `CHECK (x IN (...))` for enums, and **no `updated_at` trigger** — every `UPDATE` in `lib/db.ts` sets it by hand, so any future update SQL must too.

`db/migrations/005_feature_requests.sql`:

```sql
BEGIN;

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
```

- `user_id` is nullable so deleting a buyer does not delete their feedback, matching `entitlements.claimed_user_id`.
- `subject_email` is a snapshot written at submission time — never join back to `entitlements` to display it.
- `status` and `note` exist so you can triage by hand in psql without a schema change later. Nothing in the app writes them; `status` stays `'new'` until you update it yourself.
- No delivery/dispatch columns. If a notification path is ever added, it is an `ALTER TABLE` in a later migration — exactly what migration `004` did for `access_email_deliveries`.

## Abuse guard

Buyer-gated, so no IP fingerprinting or HMAC is needed — but an authenticated buyer running a script could still fill the table. Cap it with one query, no new table:

```sql
SELECT count(*) FROM feature_requests
WHERE user_id = $1 AND created_at > now() - interval '1 hour'
```

Above 5, return `429`. Unlike the magic-link endpoint there is nothing to conceal here, so the response states the limit honestly:

> `שלחתם כמה בקשות ברצף. אפשר לשלוח עוד בעוד שעה.`

Every user-facing string in this feature is Hebrew, including error responses from the API — no English fallbacks.

Keep the honeypot field in the form anyway — it costs three lines and matches `magic-link-form.tsx`.

## Validation rules (pure, in `lib/feedback/request.ts`)

- `kind` ∈ the three enum values, `target` ∈ the four enum values; anything else → `400`.
- `title`: trimmed, 3–120 chars.
- `body`: trimmed, 10–4000 chars.
- Strip control characters. Do not otherwise sanitize — Postgres is parameterized, and nothing renders this as HTML.
- Honeypot non-empty → return the success shape without writing anything.

`submitFeatureRequest(input, dependencies)` takes `{ insert, countRecent }` and returns `{ body, status }`. It imports nothing from `lib/db` or `lib/auth`. `lib/feedback/types.ts` holds the `FeatureRequestKind` / `FeatureRequestTarget` unions and the insert input type, shared by the lib, the route, and the form.

The caller (`app/api/feedback/route.ts`) resolves session and entitlement first and returns before the handler ever runs. It uses **`readAccess`**, not `authorizeAccess`: the latter also calls `claimEntitlement`, which writes to `entitlements`, and submitting feedback must not claim an entitlement — otherwise every malformed, honeypotted or rate-limited POST issues a write. `readAccess` was extracted from `authorizeAccess` in `lib/access/authorization.ts` so both share one branch order and `authorizeAccess` keeps its claim step for `/access`. Verified against `lib/access/authorization.ts`: the entitlement id exists on **only** the `"granted"` branch, as `authorization.entitlement.id`. Map the branches explicitly, because `entitlement_id` is `NOT NULL` with a foreign key and a missed branch fails at insert time, not at compile time:

- `"anonymous"` or `"unverified"` → `401`.
- `"denied"` → `403`.
- `"granted"` → call the handler with `userId: session.user.id`, `entitlementId: authorization.entitlement.id`, and `subjectEmail: normalizeEmail(session.user.email)` (the same `normalizeEmail` from `lib/access/email.ts` that `authorizeAccess` matched on, so the snapshot agrees with `entitlements.subject_email`).

The handler receives those three as already-trusted inputs and never derives identity from the request body.

## UI

`app/access/feedback-form.tsx` — `"use client"`, same state machine and styling as `magic-link-form.tsx`:

- `kind` — three radio pills: `בקשת פיצ'ר` / `באג` / `משוב כללי`.
- `target` — select: `תבנית ה־Web` / `תבנית ה־Mobile` / `שתיהן` / `האתר והפורטל`.
- `title` — text input, label `נושא`.
- `body` — textarea, 6 rows, label `מה תרצו שנוסיף או נתקן?`.
- Honeypot `website` field inside an `sr-only` wrapper.
- Success: `תודה! הבקשה נרשמה ואעבור עליה.` via `role="status"`; the form collapses to the confirmation rather than re-arming.
- Error: `role="alert"` with the Hebrew message from the server.

Because nothing notifies you, **do not promise a reply in the copy.** "נרשמה ואעבור עליה" is accurate; "אחזור אליכם" would not be.

Placement: a new section in `app/access/product-access.tsx`, directly **above** the existing "לא קיבלתם הזמנה ל־GitHub?" support block — so the page reads: your repos → what to do now → tell me what's missing → support. Use the established section style (`// FEEDBACK` mono eyebrow + large black heading).

## Reading the submissions

Nothing pushes these to you, so the plan is not finished until there is a documented way to read them. Add to `README.md`, next to the migration one-liner and in the same style:

```bash
node --env-file=.env.local --input-type=module -e 'import pg from "pg"; const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL }); const { rows } = await pool.query("SELECT created_at, kind, target, title, body, subject_email, status FROM feature_requests ORDER BY created_at DESC LIMIT 50"); console.table(rows.map(r => ({ ...r, body: r.body.slice(0, 60) }))); await pool.end();'
```

Triage by hand: `UPDATE feature_requests SET status = 'planned', note = '…', updated_at = now() WHERE id = '…';`

## Tests

`tests/feature-request.test.ts` — pure `submitFeatureRequest` with fake dependencies, matching the `node:test` + fake-deps shape of the existing suite:

- A valid submission calls `insert` once with the trusted identity fields and returns `200`.
- Each validation rule rejects with `400` and does not insert: bad `kind`, bad `target`, short/long `title`, short/long `body`.
- Honeypot non-empty returns the success shape and does not insert.
- Over the hourly cap returns `429` and does not insert.
- Control characters are stripped from `title` and `body` before insert.

Run `npm test` and `npm run lint`.

## Delivery checklist

1. Add `db/migrations/005_feature_requests.sql` **and** append it to the `README.md` migration one-liner.
2. Implement `lib/feedback/` with its test, then the route, then the UI.
3. Apply the migration locally and submit once end to end; confirm the row exists with `status = 'new'`.
4. Confirm a `400` path (empty body) shows the Hebrew error in the form, and that the 6th submission in an hour returns `429`.
5. Add the read-back one-liner to `README.md` and run it to confirm it prints the row.
6. `npm run lint` and `npm test` pass.

## Deferred / considered and rejected

- **GitHub issue notification** — planned first, then dropped by the user on 2026-09-19 in favour of storing only. It would have required `Issues: Read and write` on the GitHub App, a re-approved installation, a dedicated private repo (buyers are `pull` collaborators on the starters and can read issues there, which would expose other buyers' emails), and a claim/mark state machine mirroring `access_email_deliveries`. Revisit only if submissions actually arrive and the DB query becomes a chore.
- **Email notification** — same call; the Resend path in `lib/email.ts` already exists if revisited.
- **Public submission** — would pull in the honeypot + HMAC rate-limit machinery from `lib/access/request.ts`. Addable later with no schema change, since `user_id` is already nullable.
- **Admin triage UI** — `status`/`note` columns make psql triage workable. A dashboard is a separate plan.
- **Upvoting / public roadmap** — needs a read surface and identity decisions; out of scope.
