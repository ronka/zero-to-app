<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository layout

The root is the Zero to App sales site and buyer portal (Next.js). `templates/` holds the generator and sources for the Web and Mobile starters; read `templates/AGENTS.md` before working there. The starters themselves are separate repositories cloned into `templates/starter-web` and `templates/starter-mobile` by `npm run templates:clone` and ignored by this repository.
