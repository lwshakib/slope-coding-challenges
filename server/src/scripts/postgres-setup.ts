/**
 * PostgreSQL Database Setup Script.
 * Initializes the 'slope' database schema.
 */

import pg from "pg";
import "dotenv/config";
import logger from "../logger/winston.logger";

async function setupPostgres() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    logger.error("❌ DATABASE_URL is not set.");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString });
  await client.connect();

  logger.info("🚀 Starting Slope PostgreSQL setup...");

  const queries = [
    // 1. Community Solution
    `CREATE TABLE IF NOT EXISTS community_solution (
      id UUID PRIMARY KEY,
      "problemSlug" TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      language TEXT NOT NULL,
      code TEXT NOT NULL,
      likes INT DEFAULT 0,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,

    // 2. Comment
    `CREATE TABLE IF NOT EXISTS comment (
      id UUID PRIMARY KEY,
      "communitySolutionId" UUID REFERENCES community_solution(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,

    // 3. Submission
    `CREATE TABLE IF NOT EXISTS submission (
      id UUID PRIMARY KEY,
      "problemSlug" TEXT NOT NULL,
      code TEXT NOT NULL,
      language TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      output TEXT,
      notes TEXT,
      runtime FLOAT,
      memory FLOAT,
      "contestId" TEXT,
      "userId" TEXT,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,

    // 4. Test Case Result
    `CREATE TABLE IF NOT EXISTS test_case_result (
      id UUID PRIMARY KEY,
      "submissionId" UUID REFERENCES submission(id) ON DELETE CASCADE,
      "caseIdx" INT NOT NULL,
      status TEXT NOT NULL,
      input TEXT NOT NULL,
      expected TEXT NOT NULL,
      actual TEXT,
      error TEXT,
      runtime FLOAT,
      memory FLOAT,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,

    // 5. Test Run
    `CREATE TABLE IF NOT EXISTS test_run (
      id UUID PRIMARY KEY,
      "problemSlug" TEXT NOT NULL,
      code TEXT NOT NULL,
      language TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      output TEXT,
      runtime FLOAT,
      memory FLOAT,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,

    // 6. Test Run Result
    `CREATE TABLE IF NOT EXISTS test_run_result (
      id UUID PRIMARY KEY,
      "testRunId" UUID REFERENCES test_run(id) ON DELETE CASCADE,
      "caseIdx" INT NOT NULL,
      status TEXT NOT NULL,
      input TEXT NOT NULL,
      expected TEXT NOT NULL,
      actual TEXT,
      error TEXT,
      runtime FLOAT,
      memory FLOAT,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,

    // 7. Contest Problem
    `CREATE TABLE IF NOT EXISTS contest_problem (
      "contestId" TEXT NOT NULL,
      "problemSlug" TEXT NOT NULL,
      "order" INT NOT NULL,
      PRIMARY KEY ("contestId", "problemSlug")
    );`,

    // 8. Contest Progress
    `CREATE TABLE IF NOT EXISTS contest_progress (
      "contestId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "currentOrder" INT NOT NULL,
      PRIMARY KEY ("contestId", "userId")
    );`
  ];

  try {
    for (const query of queries) {
      await client.query(query);
    }
    logger.info("✅ PostgreSQL schema is ready.");
  } catch (error) {
    logger.error("❌ PostgreSQL setup failed:", error);
    process.exit(1);
  } finally {
    await client.end();
    logger.info("👋 Database connection closed.");
  }
}

setupPostgres().then(() => {
  process.exit(0);
});
