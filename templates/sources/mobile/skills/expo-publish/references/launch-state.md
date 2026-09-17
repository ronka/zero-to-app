# Mobile release record

Maintain `LAUNCH.md` in the buyer's project, outside generated files. Preserve existing web/other launch sections.

```markdown
# Launch

## Mobile

- Requested outcome and platforms:
- EAS account/project ID:
- CLI version:
- Source revision and uncommitted-change summary:
- Prepared marketing version / OTA counter:
- Runtime, channel and environment:
- Last updated:

| Platform | Build ID / URL | Build number | Build state | Device verification | Submission ID / state | Store publication |
| --- | --- | --- | --- | --- | --- | --- |
| iOS | | | pending | pending | pending | pending |
| Android | | | pending | pending | pending | pending |

### OTA attempts

- Timestamp, source, prepared counter, group ID, runtime/channel/environment, observed receipt.

### Continue

- Last successful stage:
- Blocker:
- Next action:
```

Use pending/verified/failed/needs-user-action with evidence and timestamps. Distinguish agent device observations from user reports. Exclude signing secrets, sensitive environment values and raw logs.

Resume by querying provider IDs and matching source/version. If no ID was captured, inspect matching recent operations first. Build success is not installation; upload is not store approval. Preserve previous attempts. Changed source/configuration creates a new attempt with affected checks rerun. Retry a failed build at its already prepared marketing version; retry upload with its existing build; inspect uncertain OTA publication before repeating it.
