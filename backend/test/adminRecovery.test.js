import assert from "node:assert/strict";
import test from "node:test";

import bcrypt from "bcryptjs";

import {
  buildInitialAdminAccountPayload,
} from "../src/controllers/adminRecoveryController.js";
import { isBcryptHash } from "../src/services/adminUserService.js";

test("initial admin payload uses the protected admin identity and role", async () => {
  const passwordHash = await bcrypt.hash("a-test-password-that-is-not-stored", 4);
  const payload = buildInitialAdminAccountPayload(passwordHash);

  assert.equal(payload.email, "admin@nexurity.com");
  assert.equal(payload.role, "Super Admin");
  assert.equal(payload.status, "Active");
  assert.equal(payload.password, passwordHash);
  assert.equal(isBcryptHash(payload.password), true);
});
