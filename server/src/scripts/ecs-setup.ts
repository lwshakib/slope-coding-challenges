/**
 * AWS ECS Infrastructure Setup Script for Slope.
 */

import { ECSClient, CreateClusterCommand, RegisterTaskDefinitionCommand } from "@aws-sdk/client-ecs";
import { CloudWatchLogsClient, CreateLogGroupCommand, PutRetentionPolicyCommand } from "@aws-sdk/client-cloudwatch-logs";
import { ECRClient, CreateRepositoryCommand, DescribeRepositoriesCommand, GetAuthorizationTokenCommand } from "@aws-sdk/client-ecr";
import { IAMClient, CreateRoleCommand, AttachRolePolicyCommand, GetRoleCommand } from "@aws-sdk/client-iam";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from "@aws-sdk/client-ec2";
import path from "path";
import { execSync } from "child_process";
import logger from "../logger/winston.logger";
import { updateEnv } from "../utils/env-updater";
import "dotenv/config";

// Configuration for AWS Client
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

// Validation: Ensure required environment variables are set before proceeding
if (!region || !accessKeyId || !secretAccessKey) {
  logger.error("❌ Missing AWS environment variables (AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY).");
  process.exit(1);
}

// Credentials object for all AWS service clients
const credentials = { accessKeyId, secretAccessKey };

// Instantiate specialized AWS clients
const ecsClient = new ECSClient({ region, credentials });
const ecrClient = new ECRClient({ region, credentials });
const iamClient = new IAMClient({ region, credentials });
const ec2Client = new EC2Client({ region, credentials });
const cwLogsClient = new CloudWatchLogsClient({ region, credentials });

// Static constant for the build container name
const CONTAINER_NAME = "code-runner-container";

/**
 * Utility function to find or create an IAM role with a given policy.
 */
async function getOrCreateRole(roleName: string, assumeRolePolicyDocument: string) {
  try {
    const roleRes = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    logger.info(`ℹ️ IAM Role ${roleName} already exists.`);
    if (!roleRes.Role || !roleRes.Role.Arn) {
      throw new Error(`❌ Role ${roleName} found but Arn is missing.`);
    }
    return roleRes.Role.Arn;
  } catch (error: any) {
    if (error.name === "NoSuchEntityException" || error.name === "NoSuchEntity") {
      logger.info(`🔧 Creating IAM Role: ${roleName}...`);
      const createRes = await iamClient.send(new CreateRoleCommand({
        RoleName: roleName,
        AssumeRolePolicyDocument: assumeRolePolicyDocument,
      }));
      
      // Wait for AWS IAM propagation delay
      await new Promise(resolve => setTimeout(resolve, 5000));
      if (!createRes.Role || !createRes.Role.Arn) {
        throw new Error("❌ Role created but Arn is missing.");
      }
      return createRes.Role.Arn;
    }
    throw error;
  }
}

/**
 * Automates the build and push of the local Docker image to AWS ECR.
 */
async function autoPushDockerImage(repositoryUri: string) {
    logger.info(`\n🐳 Authenticating Docker with AWS ECR...`);
    const authRes = await ecrClient.send(new GetAuthorizationTokenCommand({}));
    if (!authRes.authorizationData || authRes.authorizationData.length === 0) {
        throw new Error("❌ No authorization data returned from ECR");
    }
    
    // Extract authentication token
    const authData = authRes.authorizationData[0];
    if (!authData || !authData.authorizationToken || !authData.proxyEndpoint) {
        throw new Error("❌ Malformed authorization data returned from ECR");
    }
    
    // Decode token and execute docker login
    const decodedToken = Buffer.from(authData.authorizationToken, "base64").toString("utf-8");
    const parts = decodedToken.split(":");
    if (parts.length < 2) {
        throw new Error("❌ Decoded authorization token is malformed");
    }
    const password = parts[1];
    const endpoint = authData.proxyEndpoint;

    logger.info(`🔐 Logging into ECR: ${endpoint}...`);
    execSync(`docker login --username AWS --password ${password} ${endpoint}`, { stdio: "inherit" });

    // Build the Docker image locally
    logger.info(`\n🔨 Building Docker image: slope-code-runner-container:latest...`);
    const buildContext = path.join(process.cwd(), "..", "containers");
    execSync(`docker build -t slope-code-runner-container:latest ${buildContext}`, { stdio: "inherit" });

    // Tag and Push the image
    logger.info(`🏷️ Tagging local image...`);
    execSync(`docker tag slope-code-runner-container:latest ${repositoryUri}:latest`, { stdio: "inherit" });

    logger.info(`🚀 Pushing image to ECR...`);
    execSync(`docker push ${repositoryUri}:latest`, { stdio: "inherit" });
    
    logger.info(`✅ Image automatically pushed to ECR!`);
}

/**
 * Comprehensive Setup function for ECS Fargate.
 */
async function setupECS() {
  logger.info("🚀 Starting Slope AWS ECS Fargate setup...");

  try {
    // 1. IAM Roles Setup: Execution and Task Roles
    const ecsAssumeRolePolicy = JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
        Effect: "Allow",
        Principal: { Service: "ecs-tasks.amazonaws.com" },
        Action: "sts:AssumeRole"
      }]
    });

    // Create or Verify Task Execution Role
    const executionRoleArn = await getOrCreateRole("SlopeTaskExecutionRole", ecsAssumeRolePolicy);
    await iamClient.send(new AttachRolePolicyCommand({
      RoleName: "SlopeTaskExecutionRole",
      PolicyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
    }));

    // Create or Verify Task Role
    const taskRoleArn = await getOrCreateRole("SlopeTaskRole", ecsAssumeRolePolicy);
    await iamClient.send(new AttachRolePolicyCommand({
      RoleName: "SlopeTaskRole",
      PolicyArn: "arn:aws:iam::aws:policy/AdministratorAccess"
    }));
    logger.info("✅ IAM Roles configured.");

    // 2. ECR Repository Setup
    let repositoryUri = "";
    try {
      const ecrRes = await ecrClient.send(new DescribeRepositoriesCommand({ repositoryNames: ["slope-code-runner"] }));
      const repos = ecrRes.repositories;
      const firstRepo = repos?.[0];
      if (!firstRepo || !firstRepo.repositoryUri) {
        throw new Error("❌ ECR repository found but URI is missing.");
      }
      repositoryUri = firstRepo.repositoryUri;
      logger.info(`ℹ️ ECR Repo slope-code-runner exists.`);
    } catch (error: any) {
      if (error.name === "RepositoryNotFoundException") {
        logger.info(`🔧 Creating ECR Repository: slope-code-runner...`);
        const createEcr = await ecrClient.send(new CreateRepositoryCommand({ repositoryName: "slope-code-runner" }));
        const repo = createEcr.repository;
        if (!repo || !repo.repositoryUri) {
          throw new Error("❌ ECR repository created but URI is missing.");
        }
        repositoryUri = repo.repositoryUri;
      } else throw error;
    }
    const containerImageUri = `${repositoryUri}:latest`;
    logger.info(`✅ ECR URI: ${containerImageUri}`);

    // Automatically build and push the container image
    // await autoPushDockerImage(repositoryUri);

    // 3. ECS Cluster Setup
    logger.info(`🔧 Creating ECS Cluster: slope-cluster...`);
    const clusterRes = await ecsClient.send(new CreateClusterCommand({ clusterName: "slope-cluster" }));
    const cluster = clusterRes.cluster;
    if (!cluster || !cluster.clusterArn) {
      throw new Error("❌ ECS Cluster created but Arn is missing.");
    }
    const clusterArn = cluster.clusterArn;
    logger.info(`✅ ECS Cluster created / verified.`);

    // 4. CloudWatch Logging Setup
    const logGroupName = `/ecs/${CONTAINER_NAME}`;
    logger.info(`🔧 Ensuring CloudWatch Log Group: ${logGroupName}...`);
    try {
        await cwLogsClient.send(new CreateLogGroupCommand({ logGroupName }));
        logger.info(`✅ Log Group ${logGroupName} created.`);
    } catch (error: any) {
        if (error.name === "ResourceAlreadyExistsException") {
            logger.info(`ℹ️ Log Group ${logGroupName} already exists.`);
        } else throw error;
    }

    // Configure Log Retention (7 days)
    await cwLogsClient.send(new PutRetentionPolicyCommand({ logGroupName, retentionInDays: 7 }));
    logger.info(`✅ Log Group retention set to 7 days.`);

    // 5. Task Definition Registration
    logger.info(`🔧 Registering ECS Task Definition: slope-run-task...`);
    const taskDefRes = await ecsClient.send(new RegisterTaskDefinitionCommand({
        family: "slope-run-task",
        cpu: "256",
        memory: "512",
        networkMode: "awsvpc",
        requiresCompatibilities: ["FARGATE"],
        executionRoleArn,
        taskRoleArn,
        containerDefinitions: [
            {
                name: CONTAINER_NAME,
                image: containerImageUri,
                essential: true,
                environment: [
                  { name: "AWS_REGION", value: region },
                  { name: "KAFKA_BROKER", value: process.env.KAFKA_BROKER || "" },
                ],
                logConfiguration: {
                    logDriver: "awslogs",
                    options: {
                        "awslogs-group": logGroupName,
                        "awslogs-region": region as string,
                        "awslogs-stream-prefix": "ecs"
                    }
                }
            }
        ]
    }));
    const taskDef = taskDefRes.taskDefinition;
    if (!taskDef || !taskDef.taskDefinitionArn) {
      throw new Error("❌ ECS Task Definition registered but Arn is missing.");
    }
    const taskDefArn = taskDef.taskDefinitionArn;
    logger.info(`✅ ECS Task Definition registered.`);

    // 6. Network Discovery
    logger.info(`🔍 Auto-discovering Default VPC networking...`);
    const vpcs = await ec2Client.send(new DescribeVpcsCommand({ Filters: [{ Name: "isDefault", Values: ["true"] }] }));
    const vpc = vpcs.Vpcs?.[0];
    if (!vpc || !vpc.VpcId) throw new Error("No default VPC found in this region.");
    const defaultVpcId = vpc.VpcId;

    const subnets = await ec2Client.send(new DescribeSubnetsCommand({ Filters: [{ Name: "vpc-id", Values: [defaultVpcId] }] }));
    const subnetIds = (subnets.Subnets || []).map(s => s.SubnetId).filter((id): id is string => !!id).join(",");

    const securityGroups = await ec2Client.send(new DescribeSecurityGroupsCommand({ Filters: [{ Name: "vpc-id", Values: [defaultVpcId] }, { Name: "group-name", Values: ["default"] }] }));
    const securityGroupId = securityGroups.SecurityGroups?.[0]?.GroupId || "";

    // 7. Update .env
    updateEnv("ECS_CLUSTER_ARN", clusterArn);
    updateEnv("ECS_TASK_DEFINITION_ARN", taskDefArn);
    updateEnv("ECS_CONTAINER_NAME", CONTAINER_NAME);
    updateEnv("ECS_SUBNETS", subnetIds);
    updateEnv("ECS_SECURITY_GROUPS", securityGroupId);

    logger.info(`\n🎉 ECS Setup Complete!`);
    
  } catch (error) {
    logger.error("❌ ECS Setup failed:", error);
    process.exit(1);
  }
}

setupECS().then(() => {
  process.exit(0);
});
