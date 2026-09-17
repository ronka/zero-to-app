# Plan 002: Complete the Expo publishing journey

> Executor: read fully, execute in order, and update `plans/README.md`. Keep local implementation, device validation, store submission, and store publication as separate gates.

## Status and intent

- Priority P1; effort L; risk MED; category direction; no technical dependency. Schedule after plan 001 for focus.
- Planned 2026-09-17 against root `7ea4a19` and `templates/starter-mobile` `874d326`.
- Audience: complete beginners. Reuse `expo-publish`; do not add a competing publish skill or rebuild setup.
- Outcome: guide an existing app through an installable tester build, production build, and store submission, with clear recovery and honest completion states.

## Current state and drift check

Root: `/Users/ronkantor/Projects/zero-to-saas`. Output: `templates/starter-mobile` (independent Git repository), not the older checkout under `/Users/ronkantor/Projects/zero-to-saas-templates`.

Run `git diff --stat 7ea4a19..HEAD -- templates` and `git -C templates/starter-mobile diff --stat 874d326..HEAD`; inspect uncommitted status. Reconcile meaningful changes with these excerpts:

- `templates/starter-mobile/package.json:42` has:
  ```json
  "update": "node scripts/increment-update-version.js src/components/version-debug-row.tsx && npx eas update",
  "build:production:ios": "node scripts/bump-app-version.js && npx eas build --platform ios --profile production",
  "build:production:android": "node scripts/bump-app-version.js && npx eas build --platform android --profile production"
  ```
- No `eas.json` currently exists. Submit and simulator commands referenced by the skill are missing.
- `templates/sources/mobile/skills/expo-publish/SKILL.md:38` suggests chaining both platform wrappers; each wrapper bumps the app version, producing two app versions for one intended release.
- That skill's lines 109–120 reference `constants/version.ts`; the starter counter actually lives in `src/components/version-debug-row.tsx`.
- `templates/sources/mobile/scripts/versioning/bump-app-version.js:31` increments unconditionally. Rerunning a wrapper after EAS fails bumps again.
- Publishing skill helper copies use their own `__dirname` layout assumptions. The installed root version helpers use `process.cwd()` and support the actual counter location. Do not copy skill helper variants over the existing root helpers.
- `templates/generator/generate.mjs:49` generates root version helpers and app-version skill copies from `mobile/scripts/versioning`; the expo-publish helper variants are intentionally separate sources. Preserve their separation.
- `app.json` sets `runtimeVersion.policy` to `appVersion`. `app.config.js` composes RTL/localization with the base config. Preserve both.

Read root and templates AGENTS.md, the mobile AGENTS.md, and Expo SDK 57 docs before implementation. Use available skill-authoring guidance when changing skills. Follow existing `node:test` tests in `templates/test/render.test.mjs` and the readable CommonJS style of version helpers; new skill helpers can use `.mjs`.

## Scope and Git

Allowed:

- `templates/sources/mobile/skills/expo-publish/SKILL.md` and new `references/launch-state.md`, `references/first-release.md`, `scripts/check.mjs`, `scripts/configure.mjs` inside that skill.
- New `templates/test/mobile-publish.test.mjs`.
- Mobile README branch in `templates/sources/scripts/init-project.mjs.tmpl`.
- `templates/starter-mobile/README.md` and `package.json` for documented release commands; corresponding lockfile only if necessary for explicit CLI dependency changes.
- Generated expo-publish copies and initializer via the generator; plan/index status and pilot evidence.

Buyer-specific `eas.json`, identifiers, project linkage, and LAUNCH.md are created at runtime in buyer/pilot projects. Do not bake an owner's project ID or store identity into the distributed starter.

Out of scope: mobile UI, new IAP/auth/backend implementation, Expo Web, sales site, rewriting generic versioning helpers, automatic store metadata generation, a new release service. Simulator/development-client setup can remain a documented optional follow-up; remove unsupported commands from the main path rather than pretending they exist.

Use `codex/mobile-publishing` if creating branches. Preserve unrelated work; parent and starter commits are separate. Follow templates AGENTS.md for committing and pushing generated changes. Never run release wrappers merely to test the template itself.

## Workflow contract

1. Read product/setup context and any existing LAUNCH.md. Infer the requested stage when clear. Otherwise ask one question: share with testers, submit to stores, or update an existing release? Ask platform only if missing.
2. Inspect real config, native identifiers, selected environment, EAS linkage, npm scripts and credentials status. Match existing project ownership and settings. Run lint/typecheck and Expo diagnostics. Account login/enrollment steps remain guided human actions when tools cannot do them.
3. Configure only missing profile/script details. For iOS internal testing explain device registration when applicable; Android internal distribution needs an installable artifact. Keep preview and production channels/environments explicit.
4. Produce a tester build and record its ID, platform, source, version/runtime and installation URL. A build passing is not proof it installed or ran. Record physical-device confirmation for the actual build; Expo Go is not native purchase/update verification.
5. For production, prepare one intended marketing version for the release. Build both platforms against that same version; do not chain the existing bump-and-build wrappers. Separate required platform build numbers/version codes from marketing version, following current EAS guidance and existing account configuration.
6. Submit the exact successful build ID for the chosen platform; never select an ambiguous “latest” build. Provide a short store checklist covering the app's actual required metadata, screenshots, account/review actions and store-specific prerequisites, linked to current official docs. Record the submission receipt/ID.
7. Report exact state: built, installed/tested, uploaded/submitted, awaiting processing/review, or publicly available. Query provider state where possible; otherwise record the owner's confirmation and its provenance. Never call an upload store approval.
8. For an OTA request, check actual runtime compatibility, target channel and native changes before publishing. Native changes require an appropriate new binary. Respect the existing appVersion policy and counter. An existing release request is sufficient authorization for its stated target; do not introduce repeated approval steps.

## Resume and retry contract

Keep a runtime `LAUNCH.md` outside generated files. Fields: requested stage/platforms, project identity, source revision/dirty summary, prepared marketing version and counter, per-platform build/submission IDs and state, channels/runtime, verification evidence, blocker, next action. Never store signing secrets or raw credential logs.

Query known build/submission IDs before retrying. Timeout or connection loss can leave a successful remote operation. If the build failed after its version bump, retry the provider build against the prepared version without rerunning the bump wrapper. If no remote ID was captured, inspect matching recent builds before starting another. A changed native source or store rejection of a reused build number requires a deliberate new build/version decision, not blind retry.

For a two-platform release, bump once, then use the provider build command for each platform. Preserve existing single-platform wrappers, but explain that resuming a release uses the recorded prepared state. Keep a failed submission separate from a failed build so retrying an upload does not rebuild needlessly.

## Implementation steps

### 1. Repair and specify the existing skill

Status: done — flow repaired, version preparation separated from retries, EAS 24.7.0 command help checked.

Replace incorrect counter-path and copy-helper guidance with repository inspection and reuse of the existing root helpers. Replace chained bump commands with the single-preparation procedure above. Add concise first-release and state references. Explicitly resolve EAS CLI invocation: the binary is `eas`, the package is `eas-cli`; use a checked available binary or an explicit package invocation rather than assuming `npx eas` resolves correctly on a clean machine.

Verify: `git diff --check` passes. Cross-check every command named by the revised main workflow against existing scripts or documented configure output. Remove unsupported simulator promises from the main workflow.

### 2. Add conservative configuration and readiness helpers

Status: done — nine behavior tests pass, including read-only checks, conflicts, malformed dynamic config, and version-preserving retries.

`configure.mjs --project <path> --check` computes a change proposal without writing. `--apply` adds missing EAS profiles and npm scripts. Preserve unrelated package/config keys. On a conflicting existing value, return a structured conflict instead of overwriting. Use current EAS profile schema; account IDs and native identifiers come from the initialized app and provider linking, never placeholders presented as working configuration. Generated profiles should support preview/internal builds, production builds, and submission. Script additions must not duplicate version bumps or hide submission target selection.

`check.mjs --project <path>` returns JSON `{status, checks:[{id,status,summary,nextAction}]}` with 0=ready, 2=needs-action, 1=failed. Checks are local/read-only: script/profile alignment, required native identifiers, linkage presence, version/counter locations and obvious channel/runtime inconsistencies. Provider authentication and device/store verification are separate workflow steps. Read resolved Expo configuration using an explicit argument-array subprocess if needed; do not execute shell-interpolated values or emit resolved secret configuration.

Test missing configuration, existing compatible profiles, conflicts with user configuration, repeat-apply idempotency, malformed JSON, paths containing spaces, missing identifiers, read-only checking, and preservation of unrelated fields. Fixture tests run offline in temporary directories. Include command-contract assertions that raw retry/build-both paths do not run a bump twice and submission targets the recorded build. Supplement these with the live retry scenarios below; tests cannot prove the agent will follow prose.

Verify: `node --test templates/test/mobile-publish.test.mjs` passes. Fixture application twice has identical content and does not alter the fixture app version.

### 3. Distribute and verify local behavior

Status: done — generated copies, lint and typecheck pass; real dynamic config checked in a disposable initialized app.

Update pre/post-setup README skill instructions. Add only commands that are valid independently, keeping account-specific configuration in runtime setup. Generate files through `npm run generate`.

Verify: `npm run test:templates`, `npm --prefix templates/starter-mobile run lint`, and `(cd templates/starter-mobile && npx tsc --noEmit)` exit 0. Inspect parent and starter diffs for scoped changes. Generate again and confirm no new diff. Execute configuration helpers in a disposable initialized copy, never attach a provider account to the distributed starter.

### 4. Validate tester builds first

Status: pending external pilot — no designated pilot app/signing/device combination was provided. Local failure/retry tests pass.

Using authorized disposable Expo/app projects, perform iOS and Android build/install pilots on physical devices with the account prerequisites satisfied. Keep an unavailable platform explicitly pending rather than inferring success from the other.

Exercise missing login, missing linkage, a profile conflict, failing build, lost connection after a build starts, and resumption using its ID. Deliberately simulate provider failures through a fake CLI for automated coverage; do not waste paid builds to manufacture failures. Verify live successful builds and at least one real resume/status lookup.

Verify: record platform/build ID, version, device confirmation and retry evidence in a dated section here. Confirm version did not increase merely because an existing operation was resumed.

### 5. Validate submission and compatible updates

Status: pending external pilot — requires the selected pilot app, verified native builds, store destinations and physical-device access.

Submit each platform's explicitly selected test build to its appropriate store testing destination when the project owner has authorized that action. Do not release a disposable app publicly just to test this plan. Record actual submission receipts and any remaining store actions. Exercise a compatible OTA update against a pilot binary and confirm receipt using the existing version/debug foundation; exercise a native-change case that correctly routes to a new binary instead.

Verify: record submission IDs and provider-reported status, plus device-observed update version/runtime. Public store availability stays pending until independently observed; implementation completion does not require publicly releasing a test product.

## Done criteria

- [x] Offline helper tests, generation check, lint and typecheck pass.
- [x] Configuration is idempotent and preserves buyer settings.
- [x] All main-workflow commands exist or are produced by the configuration helper.
- [x] Installed skill uses the real starter counter and preserves its version foundation.
- [ ] Both platforms build/install successfully in the pilot, or remaining platform validation is explicitly recorded.
- [ ] Build/submit retry reuses recorded state and does not inadvertently bump again.
- [ ] Submission and OTA gates have actual provider/device evidence; external blockers remain visible.
- [ ] Beginner pilot interventions recorded; index DONE only when the intended delivery gates pass.

## Stop conditions and maintenance

Stop the affected external action if project ownership or build selection is ambiguous, configuration conflicts with buyer choices, accounts/credentials are unavailable, or changes require a new backend/native feature. Finish independent local work and report the exact remaining action. Account/store processing delays are pending external gates, not implementation failures.

Recheck Expo SDK/CLI and store instructions before implementation; never promise fees, timing or approval from stale docs. Preserve the existing separate source ownership of version helpers. Keep provider state queries authoritative over a stale Markdown ledger.

References checked 2026-09-17: [EAS build setup](https://docs.expo.dev/build/setup/), [internal distribution](https://docs.expo.dev/build/internal-distribution/), [store submission](https://docs.expo.dev/deploy/submit-to-app-stores/). Internal distribution has platform-specific installation requirements; store upload, testing and public rollout are separate stages. Recheck detailed submit/update references while implementing.

### Local evidence — 2026-09-17

- Disposable copy of the actual mobile starter: applied generated profiles/scripts, re-applied with zero changes, resolved its actual app.config.js through the local Expo CLI, and passed all-platform/OTA local readiness using explicitly fake linkage. No remote readiness was inferred.
- Fixture Git repository: real root helper bumped 1.2.3 to 1.2.4 once; a failed raw all-platform build and retry retained 1.2.4. Submission forwarded the specified build ID. A failed OTA publish and retry retained counter 4.
- Custom profile conflicts, inherited profiles, simulator/incorrect Android artifacts and invalid dynamic-config output are reported rather than silently marked ready.
- Mobile lint and TypeScript checks passed. Skill validator passed.
- EAS account login exists on this machine; no mobile remote project, paid build, signing change, store upload or OTA publish was initiated.

- Delivery: mobile starter commit `f0619f5` pushed to `origin/main`.
