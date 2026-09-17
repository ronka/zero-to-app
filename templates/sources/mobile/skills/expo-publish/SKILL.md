---
name: expo-publish
description: Publish an Expo app through EAS tester builds, store submission, or compatible OTA updates. Configure missing release profiles and environment settings, verify results, and resume failed attempts.
---

# Publish the mobile app

Read `AGENTS.md`, `PRODUCT.md`, `SETUP.md` and `LAUNCH.md` when present. Match the conversation language and give one next action at a time. Infer the requested stage/platform; ask only when it is unclear whether the user wants a tester build, store submission, or an update.

Read [first-release.md](references/first-release.md) for commands, environments and device/store prerequisites. Use [launch-state.md](references/launch-state.md) before the first external operation.

## Prepare

1. Inspect actual npm scripts, resolved Expo config and existing EAS linkage. Run `node <skill-directory>/scripts/configure.mjs --project <project-directory> --check`. With no conflicts, `--apply` adds the supported profiles/commands while preserving unrelated fields. Inspect named conflicts and reconcile intended settings; never overwrite custom configuration silently.
2. Run `node <skill-directory>/scripts/check.mjs --project <project-directory> --platform <ios|android|all>`. Add `--update` for OTA. This checks local readiness, not authentication, signing, installation or store status. Run lint, TypeScript checks and Expo diagnostics; fix release-relevant failures.
3. Verify the intended account/project. Link an unlinked initialized app and configure updates when needed, then rerun readiness. Guide owner login/account actions. Configure the app's required environment values for the selected EAS environment. Private backend credentials must stay in a backend.

## Publish and verify

4. For first distribution, build for testers, save the build ID immediately, and verify installation/core behavior on a physical device. Record the actual build/version; an Expo Go session does not verify native purchases or OTA behavior.
5. For a new production release, prepare the marketing version once, then build requested platforms using that version. Each existing single-platform production wrapper bumps and commits: do not chain them for a two-platform release. Use the separate prepare/build commands in the reference. Store build numbers are distinct from marketing version.
6. Submit the exact verified build ID for the chosen platform. Save and inspect the submission receipt. Report uploaded, processing/testing, awaiting review, and publicly available separately. Give the owner the next necessary store action; submission does not imply publication.
7. For OTA, verify the installed runtime, native-change compatibility, channel and environment before preparing the counter once. Preserve `runtimeVersion.policy: "appVersion"` and the counter in `src/components/version-debug-row.tsx`. Confirm receipt on the intended binary; native changes require a new binary/runtime.

## Recover

Query recorded build/submission/update IDs before retrying. A timeout can leave a successful remote operation. Without an ID, inspect recent operations matching project, source, platform, version and target before issuing another.

The app version or OTA counter may already have been committed before EAS failed. Reuse that prepared version for the same attempt using raw build/update commands, not bump wrappers. A failed submission can reuse its successful build. A store build-number conflict or changed native source requires a deliberate new build decision. Keep the starter's existing root version helpers; the legacy scripts bundled here target another layout and must not be copied over them.

Record observed results in LAUNCH.md. End with the relevant link, exactly what was verified, and one next action. Continue within existing publishing authorization; resolve ambiguous destinations before external changes. Unavailable account, store-review or device actions remain explicit pending milestones.
