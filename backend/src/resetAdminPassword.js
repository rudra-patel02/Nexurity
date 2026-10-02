import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";

import connectDB, { getMongoUriMetadata } from "./config/db.js";
import User from "./models/user.js";
import bcrypt from "bcryptjs";
import { ADMIN_EMAIL } from "./services/adminUserService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const ADMIN_ROLES = new Set(["Admin", "Super Admin"]);
const EXPECTED_DATABASE = "nexurity";

const prompt = (question) =>
  new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.once("data", (value) => {
      process.stdout.write("\n");
      resolve(String(value).trim());
    });
  });

const promptSecret = (question) =>
  new Promise((resolve, reject) => {
    const input = process.stdin;
    const output = process.stdout;
    let value = "";

    if (!input.isTTY || typeof input.setRawMode !== "function") {
      reject(new Error("A secure interactive terminal is required for password entry"));
      return;
    }

    output.write(question);

    input.setRawMode(true);
    input.resume();

    const finish = (error) => {
      input.setRawMode(false);
      input.pause();
      input.removeListener("data", onData);

      if (error) {
        reject(error);
      } else {
        output.write("\n");
        resolve(value);
      }
    };

    const onData = (chunk) => {
      for (const character of String(chunk)) {
        if (character === "\u0003") {
          finish(new Error("Password reset cancelled"));
          return;
        }

        if (character === "\r" || character === "\n") {
          finish();
          return;
        }

        if (character === "\b" || character === "\u007f") {
          value = value.slice(0, -1);
        } else {
          value += character;
        }
      }
    };

    input.on("data", onData);
  });

const getInput = async (name, question) =>
  process.env[name] || prompt(question);

const resetAdminPassword = async () => {
  if (process.env.RESET_ADMIN_CONFIRM_PRODUCTION !== "YES") {
    throw new Error(
      "Set RESET_ADMIN_CONFIRM_PRODUCTION=YES after confirming this shell uses the production MongoDB URI"
    );
  }

  const metadata = getMongoUriMetadata();

  if (metadata.database !== EXPECTED_DATABASE) {
    throw new Error(
      `Refusing to run: MONGO_URI must target the ${EXPECTED_DATABASE} database`
    );
  }

  const localHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);
  const pointsToLocalHost = metadata.hosts.some((host) =>
    localHosts.has(host.replace(/^\[|\]$/g, "").split(":")[0])
  );

  if (pointsToLocalHost) {
    throw new Error("Refusing to run against a local MongoDB host");
  }

  const email = String(
    await getInput("RESET_ADMIN_EMAIL", `Admin email [${ADMIN_EMAIL}]: `)
  )
    .trim()
    .toLowerCase() || ADMIN_EMAIL;
  const password = String(await promptSecret("New password: "));
  const confirmation = String(await promptSecret("Confirm new password: "));

  if (email !== ADMIN_EMAIL) {
    throw new Error(`This utility only manages ${ADMIN_EMAIL}`);
  }

  if (password.length < 12) {
    throw new Error("The new password must be at least 12 characters long");
  }

  if (password !== confirmation) {
    throw new Error("The new passwords do not match");
  }

  await connectDB();

  const allowCreate = process.env.RESET_ADMIN_CREATE === "true";
  let user = await User.findOne({ email }).select("+password +refreshToken");

  if (!user && !allowCreate) {
    throw new Error("No existing user was found for that email");
  }

  if (user && !ADMIN_ROLES.has(user.role)) {
    throw new Error("The selected user is not an admin account");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  user ??= new User({
    email,
    name: "Nexurity Admin",
    password: passwordHash,
    refreshToken: "",
    role: "Super Admin",
    status: "Active",
  });
  user.password = passwordHash;
  user.refreshToken = "";
  await user.save();

  const verifiedUser = await User.findOne({ email }).select("email role status");

  if (!verifiedUser || !ADMIN_ROLES.has(verifiedUser.role)) {
    throw new Error("Admin account verification failed after save");
  }

  console.log(
    JSON.stringify({
      message: "Admin password reset completed",
      database: EXPECTED_DATABASE,
      email: verifiedUser.email,
      role: verifiedUser.role,
      status: verifiedUser.status,
      userId: String(user._id),
    })
  );
};

try {
  await resetAdminPassword();
} catch (error) {
  console.error(`Admin password reset failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.connection.close();
}
