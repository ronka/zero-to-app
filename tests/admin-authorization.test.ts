import assert from "node:assert/strict";
import test from "node:test";

import { ADMIN_EMAIL, isAdminSession, parseStatusUpdate } from "../lib/admin/authorization";

const id = "b4a612a9-181c-4f6f-b5f9-4164c27a3dde";

test("only the verified operator email is an admin", () => {
  assert.equal(isAdminSession(null), false);
  assert.equal(isAdminSession({ user: { email: ADMIN_EMAIL, emailVerified: true } }), true);

  // Casing and stray whitespace still match; everything else does not.
  assert.equal(
    isAdminSession({ user: { email: `  ${ADMIN_EMAIL.toUpperCase()} `, emailVerified: true } }),
    true,
  );
  assert.equal(isAdminSession({ user: { email: ADMIN_EMAIL, emailVerified: false } }), false);
  assert.equal(isAdminSession({ user: { email: "buyer@example.com", emailVerified: true } }), false);
  assert.equal(
    isAdminSession({ user: { email: `${ADMIN_EMAIL}.evil.com`, emailVerified: true } }),
    false,
  );
});

test("a status update is accepted only for a real id and a known status", () => {
  assert.deepEqual(parseStatusUpdate({ id, status: "planned", note: " נבדק " }), {
    id,
    status: "planned",
    note: "נבדק",
  });

  // An empty or whitespace-only note clears the column rather than storing "".
  assert.equal(parseStatusUpdate({ id, status: "new", note: "   " })?.note, null);
  assert.equal(parseStatusUpdate({ id, status: "new" })?.note, null);

  // Anything Postgres' CHECK constraint would reject is refused before the query.
  assert.equal(parseStatusUpdate({ id, status: "completed" }), null);
  assert.equal(parseStatusUpdate({ id, status: "" }), null);
  assert.equal(parseStatusUpdate({ id, status: undefined }), null);
  assert.equal(parseStatusUpdate({ id: "not-a-uuid", status: "new" }), null);
  assert.equal(parseStatusUpdate({ id: 42, status: "new" }), null);
  assert.equal(parseStatusUpdate({ id: `${id}'; DROP TABLE x;--`, status: "new" }), null);
});

test("a long note is truncated instead of failing", () => {
  const update = parseStatusUpdate({ id, status: "triaged", note: "א".repeat(3000) });
  assert.equal(update?.note?.length, 2000);
});
