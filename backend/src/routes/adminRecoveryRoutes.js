import express from "express";

import {
  createInitialAdminAccount,
  getAdminRecoveryStatus,
  recoverAdminPassword,
} from "../controllers/adminRecoveryController.js";
import { rateLimit } from "../middleware/securityMiddleware.js";

const router = express.Router();

router.post(
  "/create",
  rateLimit({ max: 3, windowMs: 15 * 60 * 1000 }),
  createInitialAdminAccount
);

router.get(
  "/status",
  rateLimit({ max: 10, windowMs: 15 * 60 * 1000 }),
  getAdminRecoveryStatus
);

router.post(
  "/",
  rateLimit({ max: 5, windowMs: 15 * 60 * 1000 }),
  recoverAdminPassword
);

export default router;
