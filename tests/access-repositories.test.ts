import assert from "node:assert/strict";
import test from "node:test";

import { githubRepository } from "../lib/access/repositories";

const metadata = {
  id: "web" as const,
  index: "01 / WEB",
  stack: "Next.js",
  title: "Web",
  description: "Web starter",
  accent: "lime",
  tags: [],
};

test("an empty optional repository URL uses the configured fallback", () => {
  const repository = githubRepository(
    metadata,
    "  ",
    "https://github.com/hightechguide/starter-web",
  );

  assert.equal(repository.url, "https://github.com/hightechguide/starter-web");
  assert.equal(repository.owner, "hightechguide");
  assert.equal(repository.repo, "starter-web");
});
