# Zero to App template sources

This folder is the source of truth for files shared by the mobile and web starter repositories. Generated files are committed in each starter so every starter remains independently usable.

The starters are independent Git repositories cloned into `starter-web/` and `starter-mobile/` and ignored by the parent repository. From the repository root, clone any missing starter with:

```bash
npm run templates:clone
```

## Commands

```bash
npm run generate
npm run generate:check
npm test
```

Edit files under `sources/`, then run `npm run generate`. The check command reports generated files that are missing, stale, or unexpectedly present.

When generation changes a starter, commit and push that starter repository, and commit the source change in the parent repository.

Platform templates use line-oriented conditional blocks:

```text
shared content
{{#mobile}}
mobile-only content
{{/mobile}}
{{#web}}
web-only content
{{/web}}
```

Shared skills are installed in both starters. Skills under `sources/mobile` or `sources/web` are installed only in that platform, and each installation is fanned out to Codex and Claude Code. The setup skill additionally receives Claude's explicit-invocation frontmatter when rendered into `.claude/skills`.

The generator owns the listed skills under `.agents/skills` and `.claude/skills` in each starter, each starter's `scripts/init-project.mjs`, the shared `CLAUDE.md`, and the mobile version helper scripts. Root `SETUP.md` files are deliberately excluded because they are mutable setup-session ledgers. The mobile Claude `rtl-layout` path remains a repository-local symlink to its Codex copy. The generic version helpers and the `expo-publish` variants remain separate sources because they target different project layouts.
