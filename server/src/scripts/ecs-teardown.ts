/**
 * AWS ECS Infrastructure Teardown Script for Slope.
 */

import { ECSClient, DeleteClusterCommand, DeregisterTaskDefinitionCommand, ListTaskDefinitionsCommand } from "@aws-sdk/client-ecs";
import { CloudWatchLogsClient, DeleteLogGroupCommand } from "@aws-sdk/client-cloudwatch-logs";
import { ECRClient, DeleteRepositoryCommand } from "@aws-sdk/client-ecr";
import { IAMClient, DeleteRoleCommand, DetachRolePolicyCommand } from "@aws-sdk/client-iam";
import logger from "../logger/winston.logger";
import "dotenv/config";

const region = process.env.AWS_REGION;
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
};

const ecsClient = new ECSClient({ region, credentials });
const ecrClient = new ECRClient({ region, credentials });
const iamClient = new IAMClient({ region, credentials });
const cwLogsClient = new CloudWatchLogsClient({ region, credentials });

async function resetECS() {
  logger.info("🗑️ Resetting AWS ECS infrastructure...");

  try {
    // 1. Delete ECS Cluster
    try {
      await ecsClient.send(new DeleteClusterCommand({ cluster: "slope-cluster" }));
      logger.info("✅ ECS Cluster slope-cluster deleted.");
    } catch (e) {}

    // 2. Deregister Task Definitions
    try {
      const taskDefs = await ecsClient.send(new ListTaskDefinitionsCommand({ familyPrefix: "slope-run-task" }));
      for (const arn of taskDefs.taskDefinitionArns || []) {
        await ecsClient.send(new DeregisterTaskDefinitionCommand({ taskDefinition: arn }));
      }
      logger.info("✅ ECS Task Definitions deregistered.");
    } catch (e) {}

    // 3. Delete ECR Repository
    try {
      await ecrClient.send(new DeleteRepositoryCommand({ repositoryName: "slope-code-runner", force: true }));
      logger.info("✅ ECR Repository slope-code-runner deleted.");
    } catch (e) {}

    // 4. Delete Log Group
    try {
      await cwLogsClient.send(new DeleteLogGroupCommand({ logGroupName: "/ecs/code-runner-container" }));
      logger.info("✅ CloudWatch Log Group deleted.");
    } catch (e) {}

    // 5. Clean up IAM Roles
    const roles = ["SlopeTaskExecutionRole", "SlopeTaskRole"];
    for (const roleName of roles) {
      try {
        const policyArn = roleName === "SlopeTaskExecutionRole" 
          ? "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
          : "arn:aws:iam::aws:policy/AdministratorAccess";
          
        await iamClient.send(new DetachRolePolicyCommand({ RoleName: roleName, PolicyArn: policyArn }));
        await iamClient.send(new DeleteRoleCommand({ RoleName: roleName }));
        logger.info(`✅ IAM Role ${roleName} deleted.`);
      } catch (e) {}
    }

    logger.info("🎉 ECS Infrastructure reset complete.");
  } catch (error) {
    logger.error("❌ ECS Reset failed:", error);
  }
}

resetECS();
