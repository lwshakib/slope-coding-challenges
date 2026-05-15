# Contributing to Slope Coding Challenges

First off, thank you for considering contributing to Slope Coding Challenges! It's people like you that make this project better for everyone.

## How to Contribute

### 1. Reporting Bugs
- Search existing issues to see if the bug has already been reported.
- If not, create a new issue using the **Bug Report** template.
- Provide as much detail as possible, including steps to reproduce, expected behavior, and actual behavior.

### 2. Suggesting Features
- Search existing issues to see if the feature has already been suggested.
- If not, create a new issue using the **Feature Request** template.
- Explain the use case and how the feature would benefit the project.

### 3. Pull Requests
- Fork the repository.
- Create a new branch for your feature or bug fix: `git checkout -b feature/your-feature-name` or `git checkout -b fix/your-bug-name`.
- Make your changes and ensure they follow the project's coding standards.
- Run tests and linting: `pnpm lint`, `pnpm typecheck`.
- Commit your changes: `git commit -m "feat: description of your feature"`.
- Push to your fork and submit a pull request against the `main` branch.
- Use the **Pull Request** template to describe your changes.

## Local Development Setup

### Prerequisites
- Node.js (>=20)
- pnpm (>=9)
- Docker & Docker Compose (Required for database, message queue, and secure code runtimes)

### Installation & Setup Guide
1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/slope-coding-challenges.git
   cd slope-coding-challenges
   ```
2. **Install dependencies**:
   ```bash
   pnpm install
   ```
3. **Set up environment variables**:
   - Copy `.env.example` to `.env` in `apps/server` and `apps/web`.
4. **Boot Background Containers (Docker)**:
   Our code execution runtimes run in isolated Docker containers for security, alongside Postgres and RabbitMQ. Start them in the background:
   ```bash
   docker-compose up -d --build
   ```
5. **Start the development environment**:
   Run the frontend (web) and backend (server) locally for fast Hot Module Reloading:
   ```bash
   pnpm dev
   ```
   *The server will automatically check and initialize the PostgreSQL database schema on startup.*

## Coding Standards
- Use TypeScript for all new code.
- Follow the project's Prettier and ESLint configurations.
- Write clear, documented code.
- Ensure all components are responsive and accessible.

## Branching Strategy
- `main`: Production-ready code.
- `develop`: Ongoing development.
- `feature/*`: New features.
- `fix/*`: Bug fixes.

Thank you for your contributions!
