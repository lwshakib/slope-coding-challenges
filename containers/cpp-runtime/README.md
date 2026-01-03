# C++ Runtime Container

This directory contains the source code for the **C++ Runtime Container**, a crucial component of the Slope distributed code execution system.

## 🚀 Purpose

The C++ Runtime provides an isolated, secure, and ephemeral Docker environment for executing user-submitted C++ code. Unlike interpreted languages, this runtime handles both **compilation** and **execution**:
1. The **Worker** receives the submission via RabbitMQ.
2. It spins up this Docker container.
3. The user's code is compiled using `g++`.
4. If successful, the binary is executed against test cases.
5. Results (stdout, stderr, execution time) are captured.
6. The container is destroyed.

## 🛠️ Technology Stack

- **Compiler**: GCC (g++)
- **Base Image**: Alpine Linux (with `build-base`)
- **Communication**: Interacts via standard I/O files or direct execution commands passed by the Worker.

## 🏃‍♂️ Local Development

While this container is designed to be orchestrated by `docker-compose` and the Worker service, you can build and test it manually:

### 1. Build the Image
```bash
docker build -t slope-runtime-cpp .
```

### 2. Run Interactively
```bash
docker run -it --rm slope-runtime-cpp
```

## 📦 Directory Structure

- `Dockerfile`: Defines the environment, installs GCC and build tools.
- `index.ts` / `run.cpp`: Entry point script that orchestrates the compile-then-run workflow.

## ⚠️ Security Notes

This container is designed to be **ephemeral** and run with limited network access in production. Compilation and execution are strictly time and memory limited.
