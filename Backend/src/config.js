import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const envPath = path.join(rootDirectory, "Backend", ".env");

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

export const config = {
  port: Number(process.env.PORT || 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  sessionDays: Number(process.env.SESSION_DAYS || 7),
  databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/om_enterprises",
  rootDirectory,
  migrationsPath: path.join(rootDirectory, "Migrations"),
};
