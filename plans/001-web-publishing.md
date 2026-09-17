# Plan 001: Add verified Vercel publishing to the web starter

> Executor: read this whole plan, then complete steps in order. Update this plan's status in `plans/README.md`. Implementation and a real publishing pilot are separate gates; report either gate still pending.

## Status and intent

- Priority P1; effort M; risk MED (external configuration and deployments); category direction; no dependency.
- Planned 2026-09-17 against root `7ea4a19` and `templates/starter-web` `80e1726`.
- User approved Vercel as the initial web publishing provider. Audience: complete beginners.
- Result: an installed `web-publish` skill handles project linking, relevant environment configuration, deployment, verification, and resuming a failed attempt.
- Do not recreate installation onboarding or product setup.

## Current state and drift check

Root is `/Users/ronkantor/Projects/zero-to-saas`. The canonical output is `templates/starter-web`, a separate Git repository; do not use the older checkout at `/Users/ronkantor/Projects/zero-to-saas-templates/starter-web`.

Run `git diff --stat 7ea4a19..HEAD -- templates` and `git -C templates/starter-web diff --stat 80e1726..HEAD`. Inspect uncommitted status in both repositories too. Reconcile substantive changes to the excerpts below before implementation.

- `templates/generator/generate.mjs:20` distributes every platform skill into both `.agents/skills` and `.claude/skills`:
  ```js
  addSkillSet(resolve(sources, platform, 'skills'), skillsRoot, {
    skip: platform === 'mobile' && provider === '.claude' ? ['rtl-layout'] : [],
  });
  ```
- `templates/starter-web/package.json:5` has `dev`, `build`, `start`, `lint`; no publishing workflow.
- `templates/sources/scripts/init-project.mjs.tmpl:207` writes the post-setup README, currently listing Grow payments and execute-plan only.
- `templates/sources/skills/setup/SKILL.md.tmpl:250` ends setup with `npm run dev`, deletes setup-only files, and retains other bundled skills.
- `templates/sources/web/skills/grow-business-payments/SKILL.md` is the existing compact platform-skill example. Follow its frontmatter/Markdown conventions.
- `templates/test/render.test.mjs` uses `node:test` and `node:assert/strict`; follow that pattern for helper behavior tests.

Read root and `templates/AGENTS.md`. Before writing a skill, use the available skill-authoring guidance. Before any Next.js code changes, read the installed `node_modules/next/dist/docs/` guidance required by AGENTS.md; runtime app changes are not expected here.

## Scope

Allowed source changes:

- New `templates/sources/web/skills/web-publish/SKILL.md`.
- New `templates/sources/web/skills/web-publish/references/launch-state.md` and `references/provider.md`.
- New `templates/sources/web/skills/web-publish/scripts/check.mjs`.
- New `templates/test/web-publish.test.mjs`.
- Web branch of `templates/sources/scripts/init-project.mjs.tmpl` (generated README skill listing).
- `templates/starter-web/README.md` (pre-setup skill listing); generated web skill copies and initializer only through generation.
- This plan and index for status and pilot evidence.

Out of scope: buyer portal, app routes/UI, new services, domain purchasing/DNS automation, other hosts, changes to the mobile starter, publishing the starter repository itself. Runtime `LAUNCH.md` is created only in a buyer/pilot project and is never generator-owned.

Use `codex/web-publishing` if creating branches. Respect existing work. Changes spanning parent and starter repositories need separate commits; follow `templates/AGENTS.md` delivery instructions and configured remotes. Commit/push policy does not authorize deploying the sales site or a starter as a product.

## Workflow contract

The user says “publish my website.” The skill:

1. Reads AGENTS.md, existing SETUP.md/PRODUCT.md and LAUNCH.md if present. Does not rerun setup. Infers whether this is a new deployment or a continuation; asks only for unresolved target/account decisions.
2. Inspects project scripts, lockfile, Node requirements and existing Vercel linkage. Runs existing lint/build checks. Inspects environment names and service configuration without echoing secret values. Existing apps may have no external services; do not force integrations.
3. Uses a version-checked Vercel CLI to authenticate/link to the intended account/project. Reuses existing linkage; never chooses among ambiguous teams silently. Guide the human through login/account steps when necessary.
4. Separates environment configuration from deployment. Preview/production scopes must match the intended target. A selected MCP connection is not proof that runtime credentials, migrations, callback URLs, or webhooks are configured. Handle already implemented services; missing product infrastructure is a clearly recorded dependency, not a reason to silently build new features.
5. Captures deployment ID/URL and waits for the actual provider state. Preserve provider errors and identify the next action. Avoid shell-interpolated user inputs and secrets in CLI arguments/logs.
6. Opens the exact deployment, distinguishes platform authentication/protection from the application, and verifies the expected screen plus one agreed core action when one exists. A starter landing page can verify identity and navigation; do not claim login/payment verification for absent features. HTTP 200 alone is insufficient.
7. For intended public publication, check access as a signed-out visitor. A protected preview can count as a tested preview, but cannot count as public launch. Do not weaken existing protection without authorization for that change.
8. Returns the URL, the precise verified result, and at most one next action. Normal publishing authorization should not trigger repeated confirmation requests; ask only for missing decisions or actions outside that authorization.

Provider nuance: do not promise `vercel deploy` without `--prod` is always an isolated preview. Current documentation says a new project's first deployment is production even without that flag. Inspect actual target behavior and record it accurately. Never use `--public` to make the app visitable: that flag exposes source.

## Resume contract

The skill maintains a short `LAUNCH.md` using the bundled reference. Fields: requested outcome, provider/project identity, target, source revision plus dirty-work summary, last successful stage, deployment ID/URL, verification evidence/time, blocker, next action. Use explicit pending/verified/failed/needs-user-action states; no secrets or raw logs.

On resume, query the recorded deployment before issuing another. A timeout is not evidence the deployment failed. If the source changed, rerun affected checks and treat a new upload as a new attempt. A failed smoke test must leave the deployment marked unverified even when provider status is ready.

## Implementation steps

### 1. Specify the skill and state reference

Status: done — workflow, provider instructions, and runtime ledger reference written.

Write the workflow above and a concise provider reference with current documentation links and tested CLI version. Keep the primary skill short; detailed service and failure cases belong in references. Include one-next-action communication and the resume contract.

Verify: `git diff --check` exits 0. Review coverage against each numbered workflow step and record any unresolved provider behavior in this plan; do not claim automation is tested yet.

### 2. Implement a small read-only checker

Status: done — eight readiness and environment-transfer tests pass.

`check.mjs` takes `--project <path>` and returns JSON `{status, checks:[{id,status,summary,nextAction}]}`. Check readable package metadata, available build/lint scripts, dependency presence and structurally valid existing project linkage. Support `ready`, `needs-action`, and `failed`; exit codes 0, 2, 1 respectively. Do not install dependencies, authenticate, deploy, read out secret values, or start a server. Runtime/service verification remains in the skill using actual provider/browser tools; this checker reports local readiness only.

Add fixture tests for a ready project, missing dependencies, missing scripts, malformed linkage, paths containing spaces, and proof that checks leave fixture files unchanged. Use temporary directories; no network.

Verify: `node --test templates/test/web-publish.test.mjs` passes all behavior tests.

### 3. Distribute and document

Status: done — both generated skill copies and pre/post-setup README entries verified.

Update both the pre-setup and post-setup README skill listings. The existing skill-directory fan-out already copies helper/reference files, so avoid modifying the generator unless evidence requires it. Run `npm run generate` then `npm run test:templates`.

Verify: all template tests pass and generation reports current artifacts. Inspect parent and child `git diff --stat`; only scoped files change. Running generation a second time produces no additional differences.

### 4. Validate a disposable product

Status: partial — live Vercel smoke test passed; beginner and protected-preview/interrupted-deploy scenarios remain pending.

Use a new disposable copy of the web starter, not the sales site or template repo. Test the checker before/after dependencies and after a deliberate local configuration error. Then use an authorized Vercel account/project to execute the workflow and browser smoke checks. If external access is unavailable, complete local work and leave the pilot explicitly pending.

Exercise: no existing linkage; reusing linkage; a failed build; interrupted waiting after deployment was created; a protected deployment; resuming after configuration is corrected. Check actual remote state, not mocks, for deployment success.

Verify locally: `npm --prefix templates/starter-web run lint` and `npm --prefix templates/starter-web run build` exit 0. For the pilot, record deployment ID, actual environment, signed-out access result, core-action evidence, and retry result under a dated section in this plan. Browser and provider evidence are required because no local test proves account-owned deployment behavior.

## Done criteria

- [x] Checker behavior tests and `npm run test:templates` pass.
- [x] Web lint/build pass; generated files have no drift.
- [x] Both coding tools receive the same publishing workflow and it remains installed after setup.
- [x] No unexpected changes in parent or starter repository status.
- [x] Live pilot has a working URL and explicit application verification evidence.
- [ ] Interrupted attempt resumes without blindly creating another project/deployment.
- [ ] A beginner can complete the pilot; interventions are recorded.
- [ ] Index marks DONE only after local and pilot gates; otherwise record the remaining gate.

## Stop conditions and maintenance

Stop the affected operation and report if the account/project target is ambiguous, provider behavior conflicts with the documented approach, required existing-service configuration cannot be resolved, or scope would expand into new product features. Preserve completed local work. Do not stop solely because a routine reversible fix is needed.

Refresh provider instructions against official docs when CLI behavior changes. Keep runtime launch records outside generated directories. Follow-up custom domains and automatic rollback are intentionally deferred.

References checked 2026-09-17: [Vercel deploy](https://vercel.com/docs/cli/deploy). Implementation must recheck linking, environment management, deployment inspection, and deployment-protection docs before selecting exact commands.

## Implementation notes

- Scope addition: `scripts/env.mjs` implements the user-confirmed environment-variable transfer requirement, with explicit target IDs, selected names, stdin transfer and redacted reports. Included in the web behavior tests.
- Provider flags checked against installed Vercel CLI 59.1.4.

### Live evidence — 2026-09-17

- Disposable project `zero-to-app-publishing-validation-20260917`, project ID `prj_nPfmCpV8SZLohANtXueSd4kr6CXW`; Vercel CLI 59.1.4.
- Helper successfully transferred only the selected dummy `PUBLISH_SMOKE_KEY` to production using stdin. A duplicate transfer without `--replace` failed without overwriting or revealing a value.
- Deployment `dpl_BHHABNWgv1iiQi5rF4Dcoxg3gVU5` reported READY, target production; re-inspected the same ID instead of creating another attempt.
- Browser with a fresh named session opened the production alias, observed the pilot identity, followed the features navigation to `#features`, and received `{ environmentConfigured: true }` from the pilot-only server endpoint.
- No real customer credentials were copied into the pilot. Browser closed and temporary dotenv files removed afterward. The disposable project and all its deployments were deleted after verification.
- Web lint/build passed, eight web helper tests passed, skill validator passed. This was an agent smoke test, not a beginner usability study.

- Delivery: web starter commit `043a2f9` pushed to `origin/main`.
