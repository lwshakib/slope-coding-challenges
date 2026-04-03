FROM oven/bun:latest

WORKDIR /app

# Install Docker CLI so the worker can run docker commands
RUN apt-get update && apt-get install -y docker.io

COPY . .

# Run the worker
CMD ["bun", "run", "index.ts"]
