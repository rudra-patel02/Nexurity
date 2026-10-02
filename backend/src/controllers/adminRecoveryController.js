import crypto from "node:crypto";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import User from "../models/user.js";
import {
  ADMIN_EMAIL,
  isBcryptHash,
} from "../services/adminUserService.js";

const ADMIN_ROLES = new Set(["Admin", "Super Admin"]);
let recoveryConsumed = false;

const tokensMatch = (providedToken, configuredToken) => {
  const provided = Buffer.from(String(providedToken || ""));
  const configured = Buffer.from(String(configuredToken || ""));

  return (
    provided.length === configured.length &&
    provided.length > 0 &&
    crypto.timingSafeEqual(provided, configured)
  );
};

const authorizeRecoveryRequest = (req, res) => {
  const configuredToken = process.env.ADMIN_RECOVERY_TOKEN || "";
  const providedToken = req.get("x-admin-recovery-token");

  if (!tokensMatch(providedToken, configuredToken)) {
    res.status(404).json({
      success: false,
      message: "Not found",
    });
    return false;
  }

  return true;
};

export const getAdminRecoveryStatus = async (req, res) => {
  if (!authorizeRecoveryRequest(req, res)) {
    return;
  }

  const user = await User.findOne({ email: ADMIN_EMAIL })
    .select("+password email role status")
    .lean();

  return res.json({
    success: true,
    database: mongoose.connection.name || "",
    admin: {
      exists: Boolean(user),
      email: user?.email || ADMIN_EMAIL,
      role: user?.role || null,
      status: user?.status || null,
      passwordIsBcrypt: isBcryptHash(user?.password),
    },
  });
};

export const buildInitialAdminAccountPayload = (passwordHash) => ({
  name: "Nexurity Admin",
  email: ADMIN_EMAIL,
  password: passwordHash,
  role: "Super Admin",
  department: "Administration",
  status: "Active",
  tenantId: "",
  organizationId: "",
  plantIds: [],
  activePlantId: "",
  refreshToken: "",
});

export const createInitialAdminAccount = async (req, res) => {
  if (!authorizeRecoveryRequest(req, res)) {
    return;
  }

  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (email !== ADMIN_EMAIL || password.length < 12) {
    return res.status(400).json({
      success: false,
      message: "The admin email and a password of at least 12 characters are required",
    });
  }

  const existingUser = await User.exists({ email: ADMIN_EMAIL });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "The admin account already exists",
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const createdUser = await User.create(
      buildInitialAdminAccountPayload(passwordHash)
    );

    return res.status(201).json({
      success: true,
      message: "Initial admin account created",
      email: createdUser.email,
      role: createdUser.role,
      status: createdUser.status,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "The admin account already exists",
      });
    }

    throw error;
  }
};

export const recoverAdminPassword = async (req, res) => {
  if (recoveryConsumed) {
    return res.status(410).json({
      success: false,
      message: "Admin recovery has already been consumed",
    });
  }

  if (!authorizeRecoveryRequest(req, res)) {
    return;
  }

  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (email !== ADMIN_EMAIL || password.length < 12) {
    return res.status(400).json({
      success: false,
      message: "A valid admin email and a password of at least 12 characters are required",
    });
  }

  const user = await User.findOne({ email }).select("+password +refreshToken");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "The existing admin account was not found",
    });
  }

  if (!ADMIN_ROLES.has(user.role)) {
    return res.status(403).json({
      success: false,
      message: "The existing account is not an admin account",
    });
  }

  user.password = await bcrypt.hash(password, 12);
  user.refreshToken = "";
  await user.save();

  const verifiedUser = await User.findOne({ email }).select("email role status");

  if (!verifiedUser || !ADMIN_ROLES.has(verifiedUser.role)) {
    return res.status(500).json({
      success: false,
      message: "Admin recovery verification failed",
    });
  }

  recoveryConsumed = true;

  return res.json({
    success: true,
    message: "Admin password recovery completed",
    email: verifiedUser.email,
    role: verifiedUser.role,
    status: verifiedUser.status,
  });
};
