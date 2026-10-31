import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { config } from "./config.js";

const { Pool } = pg;
const pool = new Pool({ connectionString: config.databaseUrl });

pool.on("error", (error) => {
  console.error("Database connection error:", error.message);
});

export async function runMigrations() {
  const client = await pool.connect();
  try {
    const files = fs.readdirSync(config.migrationsPath)
      .filter((file) => file.endsWith(".sql") && file !== "003_create_migration_log.sql")
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(config.migrationsPath, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    // This metadata table is not used by the application.
    await client.query("DROP TABLE IF EXISTS schema_migrations");
    console.log("Database connected and schema is ready.");
  } finally {
    client.release();
  }
}

export default pool;
