# Python Runtime Container

This directory contains the source code for the **Python Runtime Container**, a crucial component of the Slope distributed code execution system.

## 🚀 Purpose

The Python Runtime provides an isolated, secure, and ephemeral Docker environment for executing user-submitted Python code. When a user submits a solution for a coding challenge:
1. The **Worker** receives the submission via RabbitMQ.
2. It spins up this Docker container.
3. The user's code + test cases are injected.
4. The code is executed, and results (stdout, stderr, execution time) are captured.
5. The container is destroyed.

## 🛠️ Technology Stack

- **Runtime**: Python 3.x
- **Base Image**: Alpine Linux (Python variant) for minimal footprint.
- **Communication**: Interacts via standard I/O files or direct execution commands passed by the Worker.

## 🏃‍♂️ Local Development

While this container is designed to be orchestrated by `docker-compose` and the Worker service, you can build and test it manually:

### 1. Build the Image
```bash
docker build -t slope-runtime-python .
```

### 2. Run Interactively
```bash
docker run -it --rm slope-runtime-python
```

## 📦 Directory Structure

- `Dockerfile`: Defines the environment, installs Python.
- `index.ts` / `run.py`: Entry point script that parses arguments, runs the user code with a timeout, and formats the output.

## ⚠️ Security Notes

This container is designed to be **ephemeral** and run with limited network access in production to prevent malicious code usage.
