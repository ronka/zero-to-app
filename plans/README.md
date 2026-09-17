# Publishing improvements

Make “publish my app” a reliable next step from the existing starters.

## Decisions

- Audience: complete beginners. Show one next action at a time; explain account-owner steps in plain language.
- Web: Vercel, confirmed by the user on 2026-09-17.
- Mobile: improve the existing Expo/EAS publishing skill for iOS and Android.
- Keep the existing setup flow. No new portal, onboarding course, general-purpose guide, or integration catalog in this work.
- Every publishing workflow records progress, verifies its actual result, and explains how to resume after failure.
- Implementation is complete locally. A disposable Vercel deployment was verified; mobile device/store validation and beginner pilots remain pending.

## Order

| Plan | Outcome | Priority | Effort | Depends on | Status |
| --- | --- | --- | --- | --- | --- |
| [001](001-web-publishing.md) | Say “publish my website” and get a verified Vercel deployment | P1 | M: several focused implementation/validation sessions | — | IMPLEMENTED — web smoke test passed; beginner pilot pending |
| [002](002-mobile-publishing.md) | Say “publish my app” and progress through a tester build and store submission | P1 | L: multiple sessions plus account/device validation | —; implement after 001 for focus | IMPLEMENTED — device/store pilot pending |

Start with 001. The plans are technically independent; each includes its own resume and verification requirements. Within 002, validate a tester build before extending to store submission and OTA recovery.

## What success means

- Web: the intended deployment is ready, its intended audience can access it, and the selected core action is checked.
- Mobile: record build, installed/tested, submitted, and store-published as different milestones. Only claim milestones backed by evidence.
- Recovery: interrupted work resumes against the existing project/build instead of blindly creating a replacement.
- Pilot: one beginner per platform completes the journey; record interventions and address blocking gaps before widening support.

## Repository baseline

Root: `7ea4a19`; generator targets: `templates/starter-web` at `80e1726`, `templates/starter-mobile` at `874d326`. These are separate Git repositories. Use the generator targets inside this repository; external starter checkouts are not generator targets.

On 2026-09-17, `npm run test:templates` passed all five existing tests and confirmed all 52 generated artifacts current. This is the generation baseline, not proof of deployment functionality.

## Deferred / considered and rejected

- Rebuilding setup or the buyer portal: duplicates existing functionality and delays the publishing improvement.
- Supporting several web hosts: validate Vercel first.
- Custom domains, automated DNS changes, new auth/payment integrations, and automatic rollback: separate follow-ups after the first publishing path works.
- A general release orchestrator or new backend: unnecessary for the first version; use provider CLIs plus focused helpers.
- Promising immediate store publication: store processing/review is an external milestone, not a successful CLI exit.

Implementation details and acceptance tests are in the linked plans. IMPLEMENTED means code and local checks are complete, not that all pilot gates have passed. See each plan for evidence and remaining validation.

## Implementation validation (2026-09-17)

- 22 template/helper tests passed; 70 generated artifacts match their sources.
- Web lint/build and mobile lint/typecheck passed. Both skill validators passed.
- Web live smoke test verified signed-out access, navigation and server receipt of a selected environment variable.
- Mobile config was applied twice in a disposable app and checked through its real dynamic Expo config. Simulated provider failures verified no duplicate version/counter bump.
- No mobile build, signing, store submission or device OTA test was performed. These require a designated pilot app and device/store access.

- Delivery: web `043a2f9` and mobile `f0619f5` pushed to their starter repositories. Root lint passed. The disposable Vercel test project was deleted after verification.
