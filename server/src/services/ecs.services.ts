/**
 * AWS ECS Service for Slope.
 * Responsible for triggering code runner tasks on AWS Fargate.
 */

import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";
import logger from "../logger/winston.logger";
import { 
  AWS_ACCESS_KEY_ID, 
  AWS_REGION, 
  AWS_SECRET_ACCESS_KEY, 
  ECS_CLUSTER_ARN, 
  ECS_CONTAINER_NAME, 
  ECS_SECURITY_GROUPS, 
  ECS_SUBNETS, 
  ECS_TASK_DEFINITION_ARN,
} from "../env";

class ECSService {
  private client: ECSClient;

  /**
   * Initializes the ECS client.
   */
  constructor() {
    this.client = new ECSClient({
      region: AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID || "",
        secretAccessKey: AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }

  /**
   * Triggers a new ECS Fargate task to run a code execution.
   */
  async runTask(params: {
    submissionId: string;
    slug: string;
    code: string;
    language: string;
    testCasePropsJson: string; // Passed as a string to environment variable
  }) {
    const { submissionId, slug, code, language, testCasePropsJson } = params;

    const command = new RunTaskCommand({
      cluster: ECS_CLUSTER_ARN,
      taskDefinition: ECS_TASK_DEFINITION_ARN,
      launchType: "FARGATE",
      count: 1,
      networkConfiguration: {
        awsvpcConfiguration: {
          assignPublicIp: "ENABLED",
          subnets: ECS_SUBNETS?.split(",") || [],
          securityGroups: ECS_SECURITY_GROUPS?.split(",") || [],
        },
      },
      overrides: {
        containerOverrides: [
          {
            name: ECS_CONTAINER_NAME,
            environment: [
              { name: "SUBMISSION_ID", value: submissionId },
              { name: "PROBLEM_SLUG", value: slug },
              { name: "CODE", value: code },
              { name: "LANGUAGE", value: language },
              { name: "TEST_CASE_PROPS", value: testCasePropsJson },
              { name: "AWS_REGION", value: AWS_REGION || "" },
            ],
          },
        ],
      },
    });

    try {
      const response = await this.client.send(command);
      logger.info(`🚀 ECS Task triggered for submission ${submissionId}: ${response.tasks?.[0]?.taskArn}`);
      return response;
    } catch (error) {
      logger.error("❌ ECS Task trigger error:", error);
      throw error;
    }
  }
}

export const ecsService = new ECSService();
export default ecsService;
