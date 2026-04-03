/**
 * PostgreSQL Database Reset Script.
 * Drops all application tables to ensure a clean state.
 */

import pg from "pg";
import "dotenv/config";
import logger from "../logger/winston.logger";

async function resetPostgres() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    logger.error("❌ DATABASE_URL is not set.");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString });

  const resetQuery = `
    DROP TABLE IF EXISTS contest_progress CASCADE;
    DROP TABLE IF EXISTS contest_problem CASCADE;
    DROP TABLE IF EXISTS test_run_result CASCADE;
    DROP TABLE IF EXISTS test_run CASCADE;
    DROP TABLE IF EXISTS test_case_result CASCADE;
    DROP TABLE IF EXISTS submission CASCADE;
    DROP TABLE IF EXISTS comment CASCADE;
    DROP TABLE IF EXISTS community_solution CASCADE;
  `;

  try {
    await client.connect();
    await client.query(resetQuery);
    logger.info("✅ Postgres tables dropped successfully.");
  } catch (error) {
    logger.error("❌ Postgres reset failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetPostgres().then(() => {
  process.exit(0);
});
