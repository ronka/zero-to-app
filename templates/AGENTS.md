# Template generation

Treat `sources/` as the source of truth for every output named in `README.md`. Edit the source, run `npm run generate`, and verify with `npm test`. Generated copies inside either starter are outputs, not editing seams.

The mobile and web starters are independent Git repositories cloned into `starter-web/` and `starter-mobile/` (ignored by the parent repository; run `npm run templates:clone` from the root if missing). Preserve unrelated work in them. Commit and push generated changes inside each starter repository. In particular, root `SETUP.md` files are mutable setup-session ledgers and are not generator-owned.

Use `{{#mobile}}` / `{{/mobile}}` and `{{#web}}` / `{{/web}}` on their own lines for platform branches in `.tmpl` files. Keep shared text outside those blocks. Add a platform branch only when the rendered behavior genuinely differs.
