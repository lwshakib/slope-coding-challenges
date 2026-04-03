/**
 * Docker Service for Slope.
 * Used for running language runtime containers locally.
 */

import { spawn } from "child_process";
import logger from "../logger/winston.logger";

class DockerService {
  /**
   * Spawns a new Docker process to run a code execution task.
   */
  async runTask(params: {
    submissionId: string;
    slug: string;
    code: string;
    language: string;
    testCase: any;
  }) {
    const { submissionId, slug, code, language, testCase } = params;

    const runtimeImage = `slope-${language}-runtime:latest`;

    const args = [
      "run",
      "--rm",
      "-e", `SUBMISSION_ID=${submissionId}`,
      "-e", `PROBLEM_SLUG=${slug}`,
      "-e", `CODE=${code}`,
      "-e", `TEST_CASE=${JSON.stringify(testCase)}`,
      runtimeImage
    ];

    logger.info(`🛠️ Triggering local Docker run for submission: ${submissionId}...`);

    return new Promise((resolve, reject) => {
      const p = spawn("docker", args);

      p.stdout?.on("data", (data) => logger.info(`[Docker Stdout]: ${String(data).trim()}`));
      p.stderr?.on("data", (data) => logger.error(`[Docker Stderr]: ${String(data).trim()}`));

      p.on("close", (code) => {
        if (code === 0) {
          logger.info(`✅ Local Docker task completed successfully.`);
          resolve(true);
        } else {
          logger.error(`❌ Local Docker task failed with exit code ${code}`);
          reject(new Error(`Docker task failed with code ${code}`));
        }
      });
    });
  }
}

export const dockerService = new DockerService();
export default dockerService;
