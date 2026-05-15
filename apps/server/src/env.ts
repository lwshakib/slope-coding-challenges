import "dotenv/config"

export const PORT = process.env.PORT || 8000
export const NODE_ENV = process.env.NODE_ENV || "development"
export const WEB_URL = process.env.WEB_URL || "http://localhost:3000"

// Message Queue
export const RABBITMQ_URL = process.env.RABBITMQ_URL

// AWS and ECS Infrastructure
export const AWS_REGION = process.env.AWS_REGION
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
export const ECS_CLUSTER_ARN = process.env.ECS_CLUSTER_ARN
export const ECS_TASK_DEFINITION_ARN = process.env.ECS_TASK_DEFINITION_ARN
export const ECS_CONTAINER_NAME = process.env.ECS_CONTAINER_NAME
export const ECS_SUBNETS = process.env.ECS_SUBNETS
export const ECS_SECURITY_GROUPS = process.env.ECS_SECURITY_GROUPS

export const DATABASE_URL = process.env.DATABASE_URL
