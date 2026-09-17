# EAS operations

Commands use EAS CLI 24.7.0; version/help checked on 2026-09-17. Recheck official docs and help when updating. Run from the app root. `eas-cli` is the package; `eas` is the executable.

## First configuration

The configure helper's `--check` proposes missing paths; `--apply` fills them. Defaults: preview/internal and production/store builds, explicit channels/environments, remote store build numbers, and production submission profiles. Conflicting values are preserved and reported by path. Reconcile intentional custom profiles manually instead of forcing defaults.

Use `npx --yes eas-cli@24.7.0 whoami` to identify the account, `npx --yes eas-cli@24.7.0 init` to link an unlinked initialized app, and `npx --yes eas-cli@24.7.0 update:configure` for OTA. Resolve ambiguous account/project choices. Preserve setup's native identifiers; never embed the starter author's project ID.

Run `npm run lint`, `npx tsc --noEmit`, and `npx expo-doctor`. The readiness helper resolves dynamic configuration using the installed Expo CLI, captures its output and emits check summaries only. It does not authenticate or call EAS.

## Environment variables

Inventory required names from the implemented app/build config. Classify public app configuration versus build-only tooling credentials. `EXPO_PUBLIC_*` values enter the app bundle; sensitive/secret visibility in EAS does not protect values embedded in a binary. Private database, email and payment credentials belong in a backend. A selected MCP server does not configure runtime SDKs.

Use the EAS project dashboard or current `env:set` interactive flow for individual values. For selected local values, prepare an ignored mode-0600 dotenv file containing only reviewed names, run `npx --yes eas-cli@24.7.0 env:push <preview|production> --path <file>`, then remove it. Check visibility behavior first; use the per-variable/file-secret flow for build credentials. Use `--force` only for intended replacements. Keep values out of command arguments, chat and launch records.

Build profile `environment` and update `--environment` must match the intended target. Secret-visibility values are unavailable to local update bundling; required public configuration must be available to that operation. Rebuild or publish a compatible update after changes and test the app's action.

## Tester builds

```bash
npm run build:preview:ios
npm run build:preview:android
```

Run requested platforms only. Capture IDs and inspect them with `npx --yes eas-cli@24.7.0 build:view <build-id> --json`. Save installation links and verify the corresponding physical device/core action. Android internal builds use APKs. iOS internal distribution usually requires an eligible Apple developer account, device registration and provisioning; guide `device:create` and signing prompts. Only provisioned devices can install that build. TestFlight is a separate store-upload path.

## Production builds and retry

For one new release:

```bash
npm run release:prepare
npm run build:release:all
```

Use `build:release:ios` or `build:release:android` for one platform. `release:prepare` bumps and commits the marketing version once through the existing helper. Record it before building. Raw `build:release:*` commands do not bump it, allowing retries at the prepared version. Existing `build:production:*` wrappers still prepare/build together for single new releases; never use them to resume.

Remote version management plus `autoIncrement` assigns fresh store build numbers/version codes while preserving marketing version. Check/synchronize existing store build numbers using current EAS version guidance before the first managed build. Preserve their history.

Inspect known IDs or matching recent builds before retrying uncertain requests. Keep build and submission separate in this workflow so the chosen successful binary is explicit.

## Store submission

```bash
npm run submit:production:ios -- --id <verified-ios-build-id>
npm run submit:production:android -- --id <verified-android-build-id>
```

Verify the build's project/platform/profile first; never use `--latest`. Android defaults to internal track and draft release status; rollout remains a store-console action. iOS uploads proceed to App Store Connect processing/TestFlight, not public App Store release. Configure real app/store IDs and signing/service-account access through provider prompts, without inventing identifiers or committing credentials.

Record receipt/submission ID; inspect through `submit:list`, `submit:view` or store status before retrying. Failed upload can reuse the build. Follow current store-specific docs for first-upload prerequisites.

Prepare only relevant listing tasks: identity/contact details, screenshots/icon, truthful privacy/data-use declarations, required URLs, permissions/review notes, reviewer account for sign-in, and purchase products when implemented. Draft declarations must match actual app behavior. Report processing, review and publication separately; verify availability before claiming it is live.

## OTA updates

Read the intended installed binary's runtime/channel. `runtimeVersion.policy: "appVersion"` means compatible JS updates keep its app version. Changed native dependencies, plugins or permissions require a new binary/runtime; TypeScript passing cannot establish compatibility.

For a new compatible update, run `npm run update:prepare` once, record the counter, then:

```bash
npm run update:publish -- --channel <intended-channel> --environment <matching-environment> --message <release-message>
```

SDK 57 requires the explicit environment. `npm run update -- <same-options>` prepares/publishes together; retry with `update:publish` to avoid bumping again. Inspect uncertain results with `update:list` / `update:view`. Confirm receipt on the intended binary through the existing version/debug display; an update ID alone is not device evidence.

Sources: [SDK 57](https://docs.expo.dev/versions/v57.0.0/), [build setup](https://docs.expo.dev/build/setup/), [internal distribution](https://docs.expo.dev/build/internal-distribution/), [versions](https://docs.expo.dev/build-reference/app-versions/), [eas.json](https://docs.expo.dev/eas/json/), [environments](https://docs.expo.dev/eas/environment-variables/usage/), [submission](https://docs.expo.dev/deploy/submit-to-app-stores/), [updates](https://docs.expo.dev/eas-update/introduction/).
