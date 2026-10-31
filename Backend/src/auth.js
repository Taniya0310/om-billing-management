import crypto from "node:crypto";
import db from "./db.js";
import { config } from "./config.js";

const hashPassword = (password, salt) =>
  crypto.scryptSync(password, salt, 64).toString("hex");

export function createPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return { salt, hash: hashPassword(password, salt) };
}

export function verifyPassword(password, salt, expectedHash) {
  const actual = Buffer.from(hashPassword(password, salt), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + config.sessionDays * 86400000).toISOString();
  await db.query("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)", [tokenHash, userId, expiresAt]);
  return { token, expiresAt };
}

export async function getUserFromToken(token) {
  if (!token) return null;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const result = await db.query(`
    SELECT users.id, users.name, users.email, sessions.token_hash, sessions.expires_at
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = $1
      AND sessions.expires_at::timestamptz > CURRENT_TIMESTAMP
  `, [tokenHash]);
  const row = result.rows[0];
  if (!row) return null;
  return { id: row.id, name: row.name, email: row.email, tokenHash: row.token_hash };
}

export async function deleteSession(token) {
  if (!token) return;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await db.query("DELETE FROM sessions WHERE token_hash = $1", [tokenHash]);
}

export function sessionCookie(token, expiresAt) {
  return `om_session=${token}; HttpOnly; Path=/; SameSite=Lax; Expires=${new Date(expiresAt).toUTCString()}`;
}

export function clearSessionCookie() {
  return "om_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0";
}

export function readCookie(request, name) {
  const cookieHeader = request.headers.cookie || "";
  const cookie = cookieHeader.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}
