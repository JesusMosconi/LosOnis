import { test } from "node:test";
import { strict as assert } from "node:assert";
import { isAllowedSession } from "./session-policy";

test("accepts Diego only when his account still exists", () => {
  assert.equal(isAllowedSession({ id: "diego", nombre: "Diego" }, { id: "diego", nombre: "Diego" }), true);
  assert.equal(isAllowedSession({ id: "diego", nombre: "Diego" }, null), false);
});

test("rejects Pablo and mismatched session identities", () => {
  assert.equal(isAllowedSession({ id: "pablo", nombre: "Pablo" }, { id: "pablo", nombre: "Pablo" }), false);
  assert.equal(isAllowedSession({ id: "pablo", nombre: "Diego" }, { id: "diego", nombre: "Diego" }), false);
  assert.equal(isAllowedSession({ id: "diego", nombre: "Diego" }, { id: "diego", nombre: "Pablo" }), false);
});
