# Slope API Server

The **Slope API Server** is the central nervous system of the Slope Platform. It manages authentication, problem data, user submissions, and orchestrates the distributed code execution workflow.

## 🏗️ Architecture

The server is built with a focus on performance, type safety, and modularity:
- **Runtime**: [Bun](https://bun.sh) (compatible with Node.js)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Message Queue**: RabbitMQ (for offloading code execution tasks)
- **Monitoring**: Winston (Logging), Morgan (HTTP Logging)

## ✨ Key Features

- **Authentication**: Secure user signup/login flows powered by `better-auth`.
- **Problem Registry**: Serves coding problems (metadata, descriptions, starter code) from a structured file-based system (`src/features/problems/data`).
- **Submission Handling**: 
    1. Receives code submissions.
    2. Creates a database record.
    3. Pushes a job to the **Submission Queue** (RabbitMQ).
    4. Listens for results via the **Result Queue**.
- **Real-time Updates**: (Planned) WebSocket integration for live status updates on submissions.

## 📂 Project Structure

```
server/
├── prisma/             # Database schema and migrations
├── scripts/            # Utility scripts (e.g., seeding problems)
├── src/
│   ├── features/       # Feature-based modules (Auth, Problems, Submissions)
│   ├── routes/         # API Route definitions
│   ├── config/         # Environment and service configuration
│   └── index.ts        # Application entry point
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Bun installed (`curl -fsSL https://bun.sh/install | bash`)
- Docker (for PostgreSQL & RabbitMQ)

### 1. Environment Setup
Copy `.env.example` to `.env` and configure your database and RabbitMQ credentials.
```bash
cp .env.example .env
```

### 2. Install Dependencies
```bash
bun install
```

### 3. Database Migration
```bash
bun run db:migrate
```



### 5. Start the Server
```bash
# Development Mode (Watch)
bun dev

# Production Build
bun build
bun start
```

## 🐋 Docker Support

The server can be fully containerized. See the root `docker-compose.yml` for how it talks to the database and queue services.
