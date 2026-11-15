import http from "node:http";
import db, { runMigrations } from "./db.js";
import { config } from "./config.js";
import {
  clearSessionCookie,
  createPassword,
  createSession,
  deleteSession,
  getUserFromToken,
  readSessionToken,
  sessionCookie,
  verifyPassword,
} from "./auth.js";

const statuses = new Set(["In transit", "Pending POD", "Paid"]);
const DETENTION_RATE = 1500;
const branches = {
  Jamshedpur: { code: "Jsr", table: "trips_jamshedpur", biltyTable: "bilties_jamshedpur", sequence: "jsr_trip_number_seq" },
  Maharashtra: { code: "MH", table: "trips_maharashtra", biltyTable: "bilties_maharashtra", sequence: "mh_trip_number_seq" },
};

function send(response, status, payload, headers = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
  });
  response.end(payload === undefined ? "" : JSON.stringify(payload));
}

function json(response, status, payload, headers) {
  send(response, status, payload, headers);
}

async function readBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1_000_000) throw new Error("Request body is too large");
  }
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    const error = new Error("Request body must be valid JSON");
    error.status = 400;
    throw error;
  }
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

async function requireUser(request, response) {
  const user = await getUserFromToken(readSessionToken(request));
  if (!user) json(response, 401, { error: "Authentication required" });
  return user;
}

function normaliseEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function tripPayload(body) {
  const booking = Number(body.booking || 0);
  const advance = body.advance === undefined || body.advance === ""
    ? booking * 0.9
    : Number(body.advance);
  const weight = typeof body.weight === "string"
    ? Number.parseFloat(body.weight)
    : Number(body.weight || 0);
  return {
    branch: branches[body.branch] ? body.branch : "Jamshedpur",
    podStatus: body.podStatus === "Received" ? "Received" : "Pending",
    clientBillStatus: body.clientBillStatus === "Made" ? "Made" : "Not made",
    date: String(body.date || "").trim(),
    reportingDate: String(body.reportingDate || "").trim(),
    unloadingDate: String(body.unloadingDate || "").trim(),
    clientName: String(body.clientName || "").trim(),
    vehicle: String(body.vehicle || "").trim(),
    from: String(body.from || "").trim(),
    to: String(body.to || "").trim(),
    weight: Number.isFinite(weight) ? weight : 0,
    freight: Number(body.freight || 0),
    booking,
    advance,
    challan: Number(body.challan || 0),
    receiver: String(body.receiver || "").trim(),
    owner: String(body.owner || "").trim(),
    phone: String(body.phone || "").trim(),
    driverPhone: String(body.driverPhone || "").trim(),
    status: statuses.has(body.status) ? body.status : "In transit",
  };
}

function tripFromRow(row, branch) {
  return {
    id: row.id,
    branch,
    podStatus: row.pod_status || "Pending",
    clientBillStatus: row.client_bill_status || "Not made",
    date: row.trip_date,
    reportingDate: row.reporting_date || "",
    unloadingDate: row.unloading_date || "",
    detentionDays: detentionDays(row.reporting_date, row.unloading_date),
    detentionAmount: detentionDays(row.reporting_date, row.unloading_date) * DETENTION_RATE,
    clientName: row.client_name,
    vehicle: row.vehicle,
    from: row.origin,
    to: row.destination,
    weight: `${row.weight} MT`,
    freight: row.freight,
    booking: row.booking,
    advance: row.advance,
    challan: row.challan,
    receiver: row.receiver,
    owner: row.owner,
    phone: row.phone,
    driverPhone: row.driver_phone,
    status: row.status,
  };
}

function detentionDays(reportingDate, unloadingDate) {
  if (!reportingDate || !unloadingDate) return 0;
  const reporting = new Date(`${reportingDate}T00:00:00Z`);
  const unloading = new Date(`${unloadingDate}T00:00:00Z`);
  if (Number.isNaN(reporting.getTime()) || Number.isNaN(unloading.getTime())) return 0;
  return Math.max(0, Math.floor((unloading - reporting) / 86400000));
}

function biltyFromRow(row) {
  return { id: row.id, tripId: row.trip_id, number: row.bilty_number, status: row.status };
}

async function getTrip(userId, tripId) {
  for (const [branch, details] of Object.entries(branches)) {
    const result = await db.query(`SELECT * FROM ${details.table} WHERE id = $1 AND user_id = $2`, [tripId, userId]);
    if (result.rows[0]) return { ...result.rows[0], _branch: branch, _table: details.table };
  }
  return undefined;
}

async function handle(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const method = request.method;
  const pathname = url.pathname;
  if (method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }
  if (method === "GET" && pathname === "/api/health") {
    json(response, 200, { ok: true, service: "om-enterprises-api" });
    return;
  }
  if (method === "POST" && pathname === "/api/auth/signup") {
    const body = await readBody(request);
    const name = String(body.name || "").trim();
    const email = normaliseEmail(body.email);
    const password = String(body.password || "");
    if (!name || !email || password.length < 6) {
      json(response, 400, { error: "Name, valid email, and a 6-character password are required" });
      return;
    }
    const existingUser = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existingUser.rows[0]) {
      json(response, 409, { error: "An account with this email already exists" });
      return;
    }
    const credentials = createPassword(password);
    const result = await db.query("INSERT INTO users (name, email, password_hash, password_salt) VALUES ($1, $2, $3, $4) RETURNING id", [name, email, credentials.hash, credentials.salt]);
    const user = { id: result.rows[0].id, name, email };
    const session = await createSession(user.id);
    json(response, 201, { user, sessionToken: session.token }, { "Set-Cookie": sessionCookie(session.token, session.expiresAt) });
    return;
  }
  if (method === "POST" && pathname === "/api/auth/login") {
    const body = await readBody(request);
    const email = normaliseEmail(body.email);
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];
    if (!user || !verifyPassword(String(body.password || ""), user.password_salt, user.password_hash)) {
      json(response, 401, { error: "The email or password is incorrect" });
      return;
    }
    const session = await createSession(user.id);
    json(response, 200, { user: publicUser(user), sessionToken: session.token }, { "Set-Cookie": sessionCookie(session.token, session.expiresAt) });
    return;
  }
  if (method === "POST" && pathname === "/api/auth/logout") {
    await deleteSession(readSessionToken(request));
    json(response, 200, { ok: true }, { "Set-Cookie": clearSessionCookie() });
    return;
  }
  if (method === "GET" && pathname === "/api/auth/me") {
    const user = await getUserFromToken(readSessionToken(request));
    json(response, user ? 200 : 401, user ? { user: publicUser(user) } : { error: "Authentication required" });
    return;
  }

  const user = await requireUser(request, response);
  if (!user) return;

  if (method === "GET" && pathname === "/api/trips") {
    const conditions = ["user_id = $1"];
    const values = [user.id];
    if (url.searchParams.get("status") && statuses.has(url.searchParams.get("status"))) {
      conditions.push(`status = $${values.length + 1}`);
      values.push(url.searchParams.get("status"));
    }
    if (url.searchParams.get("from")) {
      conditions.push(`trip_date >= $${values.length + 1}::text`);
      values.push(url.searchParams.get("from"));
    }
    if (url.searchParams.get("to")) {
      conditions.push(`trip_date <= $${values.length + 1}::text`);
      values.push(url.searchParams.get("to"));
    }
    const queries = Object.entries(branches).map(([branch, details]) =>
      `SELECT *, '${branch}' AS branch_name FROM ${details.table} WHERE ${conditions.join(" AND ")}`,
    );
    const result = await db.query(`${queries.join(" UNION ALL ")} ORDER BY trip_date DESC, created_at DESC`, values);
    json(response, 200, { trips: result.rows.map((row) => tripFromRow(row, row.branch_name)) });
    return;
  }

  if (method === "POST" && pathname === "/api/trips") {
    const body = tripPayload(await readBody(request));
    if (!body.date || !body.reportingDate || !body.vehicle || !body.from || !body.to) {
      json(response, 400, { error: "Date, reporting date, vehicle, origin, and destination are required" });
      return;
    }
    if (body.unloadingDate && body.unloadingDate < body.reportingDate) {
      json(response, 400, { error: "Unloading date cannot be before reporting date" });
      return;
    }
    const branchDetails = branches[body.branch];
    const numberResult = await db.query(`SELECT nextval('${branchDetails.sequence}') AS trip_number`);
    const tripNumber = Number(numberResult.rows[0].trip_number);
    const id = `${branchDetails.code}-${String(tripNumber).padStart(3, "0")}`;
    await db.query(`INSERT INTO ${branchDetails.table} (id, trip_number, user_id, trip_date, reporting_date, unloading_date, client_name, vehicle, origin, destination, weight, freight, booking, advance, challan, receiver, owner, phone, driver_phone, status, pod_status, client_bill_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`, [
      id, tripNumber, user.id, body.date, body.reportingDate, body.unloadingDate || null, body.clientName, body.vehicle, body.from, body.to, body.weight,
      body.freight, body.booking, body.advance, body.challan, body.receiver, body.owner,
      body.phone, body.driverPhone, body.status, body.podStatus, body.clientBillStatus,
    ]);
    json(response, 201, { trip: tripFromRow(await getTrip(user.id, id), body.branch) });
    return;
  }

  const biltyListMatch = pathname.match(/^\/api\/trips\/([^/]+)\/bilties$/);
  const biltyItemMatch = pathname.match(/^\/api\/trips\/([^/]+)\/bilties\/(\d+)$/);
  if (biltyListMatch || biltyItemMatch) {
    const tripId = decodeURIComponent((biltyListMatch || biltyItemMatch)[1]);
    const existing = await getTrip(user.id, tripId);
    if (!existing) {
      json(response, 404, { error: "Trip not found" });
      return;
    }
    const branchDetails = branches[existing._branch];
    if (method === "GET" && biltyListMatch) {
      const result = await db.query(`SELECT * FROM ${branchDetails.biltyTable} WHERE trip_id = $1 ORDER BY id`, [tripId]);
      json(response, 200, { bilties: result.rows.map(biltyFromRow) });
      return;
    }
    if (method === "POST" && biltyListMatch) {
      const body = await readBody(request);
      const number = String(body.number || body.biltyNumber || "").trim();
      if (!number) {
        json(response, 400, { error: "Bilty number is required" });
        return;
      }
      const result = await db.query(`INSERT INTO ${branchDetails.biltyTable} (trip_id, bilty_number, status) VALUES ($1, $2, $3) RETURNING *`, [tripId, number, body.status === "Received" ? "Received" : "Pending"]);
      json(response, 201, { bilty: biltyFromRow(result.rows[0]) });
      return;
    }
    if (method === "PATCH" && biltyItemMatch) {
      const biltyId = Number(biltyItemMatch[2]);
      const body = await readBody(request);
      const status = body.status === "Received" ? "Received" : "Pending";
      const result = await db.query(`UPDATE ${branchDetails.biltyTable} SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND trip_id = $3 RETURNING *`, [status, biltyId, tripId]);
      if (!result.rows[0]) {
        json(response, 404, { error: "Bilty not found" });
        return;
      }
      json(response, 200, { bilty: biltyFromRow(result.rows[0]) });
      return;
    }
  }

  const tripMatch = pathname.match(/^\/api\/trips\/([^/]+)(?:\/(advance))?$/);
  if (tripMatch && (method === "PATCH" || method === "DELETE")) {
    const tripId = decodeURIComponent(tripMatch[1]);
    const existing = await getTrip(user.id, tripId);
    if (!existing) {
      json(response, 404, { error: "Trip not found" });
      return;
    }
    if (method === "DELETE") {
      await db.query(`DELETE FROM ${existing._table} WHERE id = $1 AND user_id = $2`, [tripId, user.id]);
      json(response, 200, { ok: true });
      return;
    }
    const body = await readBody(request);
    if (tripMatch[2] === "advance") {
      const advance = Number(body.advance);
      if (!Number.isFinite(advance) || advance < 0) {
        json(response, 400, { error: "Advance must be a non-negative number" });
        return;
      }
      await db.query(`UPDATE ${existing._table} SET advance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3`, [advance, tripId, user.id]);
    } else {
      const bodyTrip = tripPayload({ ...tripFromRow(existing), ...body });
      if (!bodyTrip.reportingDate) {
        json(response, 400, { error: "Reporting date is required" });
        return;
      }
      if (bodyTrip.unloadingDate && bodyTrip.unloadingDate < bodyTrip.reportingDate) {
        json(response, 400, { error: "Unloading date cannot be before reporting date" });
        return;
      }
      const updateResult = await db.query(`UPDATE ${existing._table} SET trip_date = $1, reporting_date = $2, unloading_date = $3, client_name = $4, vehicle = $5, origin = $6, destination = $7, weight = $8, freight = $9, booking = $10, advance = $11, challan = $12, receiver = $13, owner = $14, phone = $15, driver_phone = $16, status = $17, pod_status = $18, client_bill_status = $19, updated_at = CURRENT_TIMESTAMP WHERE id = $20 AND user_id = $21 RETURNING *`, [
        bodyTrip.date, bodyTrip.reportingDate, bodyTrip.unloadingDate || null, bodyTrip.clientName, bodyTrip.vehicle, bodyTrip.from, bodyTrip.to, bodyTrip.weight,
        bodyTrip.freight, bodyTrip.booking, bodyTrip.advance, bodyTrip.challan, bodyTrip.receiver,
        bodyTrip.owner, bodyTrip.phone, bodyTrip.driverPhone, bodyTrip.status, bodyTrip.podStatus, bodyTrip.clientBillStatus, tripId, user.id,
      ]);
      if (!updateResult.rows[0]) {
        json(response, 404, { error: "Trip not found" });
        return;
      }
      json(response, 200, { trip: tripFromRow(updateResult.rows[0], existing._branch) });
      return;
    }
    json(response, 200, { trip: tripFromRow(await getTrip(user.id, tripId), existing._branch) });
    return;
  }

  json(response, 404, { error: "Route not found" });
}

const server = http.createServer((request, response) => {
  const requestOrigin = request.headers.origin;
  const allowedOrigins = new Set([
    ...String(config.frontendOrigin)
      .split(",")
      .map((origin) => origin.trim().replace(/\/+$/, ""))
      .filter(Boolean),
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ]);
  const normalisedOrigin = requestOrigin?.replace(/\/+$/, "");
  if (normalisedOrigin && allowedOrigins.has(normalisedOrigin)) {
    response.setHeader("Access-Control-Allow-Origin", normalisedOrigin);
    response.setHeader("Vary", "Origin");
  }
  response.setHeader("Access-Control-Allow-Credentials", "true");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  handle(request, response).catch((error) => {
    console.error(`${request.method} ${request.url}`, error);
    const payload = {
      error: error.status ? error.message : "Internal server error",
      ...(process.env.NODE_ENV !== "production" && {
        detail: error.message,
        code: error.code,
      }),
    };
    json(response, error.status || 500, payload);
  });
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Server could not start: port ${config.port} is already in use.`);
  } else {
    console.error("Server error:", error.message);
  }
  process.exitCode = 1;
});

runMigrations()
  .then(() => server.listen(config.port, () => {
    console.log(`OM Enterprises API listening on http://localhost:${config.port}`);
  }))
  .catch((error) => {
    console.error("Database startup failed:", error.message);
    if (error.code) console.error(`Database error code: ${error.code}`);
    process.exitCode = 1;
  });
