import { config } from "dotenv";
import path from "path";
import fs from "fs";

function loadEnvFile(fileName: string) {
  const filePath = path.resolve(process.cwd(), fileName);
  if (fs.existsSync(filePath)) {
    config({ path: filePath });
    console.log(`ℹ️ Loaded: ${fileName}`);
  } else {
    console.warn(`⚠️ Skipped missing file: ${fileName}`);
  }
}

// Always load base .env first (shared values)
loadEnvFile(".env");

// Decide which override to load
const isProd = process.env.NODE_ENV === "production";
loadEnvFile(isProd ? ".env.production" : ".env.local");

const requiredEnvVars = [
  "DATABASE_URL",
  "NEXT_PUBLIC_APP_NAME",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
];

const missing = requiredEnvVars.filter(
  (key) => !process.env[key] || process.env[key]?.trim() === ""
);

if (missing.length > 0) {
  console.error("❌ Missing required environment variables:");
  missing.forEach((m) => console.error(`   - ${m}`));
  process.exit(1);
} else {
  console.log("✅ All required environment variables are set.");
}
