import express from "express";

import { recoverAdminPassword } from "../controllers/adminRecoveryController.js";
import { rateLimit } from "../middleware/securityMiddleware.js";

const router = express.Router();

router.post(
  "/",
  rateLimit({ max: 5, windowMs: 15 * 60 * 1000 }),
  recoverAdminPassword
);

export default router;
