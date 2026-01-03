# Contributing to Slope

First off, thank you for considering contributing to Slope! It's people like you that make Slope a great tool. We welcome contributions from everyone, whether you're fixing a bug, improving documentation, or adding a new feature.

## 🛠️ Development Setup

Slope is a monorepo-style project containing a frontend, backend, and several Docker-based runtime environments.

### Prerequisites
- **Bun**: We use [Bun](https://bun.sh) as our primary package manager and runtime for the server.
- **Docker**: Required for running the database (Postgres), message queue (RabbitMQ), and code execution containers.
- **Node.js**: v18+ (though Bun is preferred for most scripts).

### Getting Started

1.  **Fork** the repository on GitHub.
2.  **Clone** your fork locally.
    ```bash
    git clone https://github.com/your-username/slope-coding-challenges.git
    cd slope-coding-challenges
    ```
3.  **Install dependencies** in both `server` and `slope-web`.
    ```bash
    cd server && bun install
    cd ../slope-web && bun install
    ```
4.  **Create a branch** for your feature or fix.
    ```bash
    git checkout -b feature/amazing-feature
    ```

## 🧩 How Can I Contribute?

### Reporting Bugs
- Use the **GitHub Issue Tracker**.
- Describe the bug clearly. Include your OS, browser version, and steps to reproduce.
- If possible, include screenshots or error logs.

### Suggesting Enhancements
- Check the issue tracker to see if the idea has already been suggested.
- Open a new issue with the **Enhancement** label.
- Explain *why* this enhancement would be useful to the community.

### Pull Requests
1.  **Code Style**:
    - We use **Prettier** and **ESLint**. Ensure your code is formatted before submitting.
    - Use **TypeScript** for all new code. Types should be explicit where possible.
    - Follow the folder structure (e.g., `features/` directory in the server).
2.  **Tests**:
    - If you are adding a new backend feature, please add relevant unit or integration tests.
    - If you are updating the execution runtimes, verify they build successfully with `docker build`.
3.  **Submission**:
    - Push your branch to your fork.
    - Open a Pull Request against the `main` branch of the original repository.
    - Provide a clear description of what you changed and why.

## 🎨 Design Guidelines (Frontend)
- **Framework**: We use Next.js 16 with the App Router.
- **Styling**: Tailwind CSS v4 is our styling engine. Avoid custom CSS files unless necessary.
- **Components**: Reuse existing Shadcn/UI components from `components/ui` whenever possible to maintain consistency.

## 🤝 Community
- Be kind and respectful.
- Check out the [Code of Conduct](CODE_OF_CONDUCT.md).

Happy coding! 🏔️
