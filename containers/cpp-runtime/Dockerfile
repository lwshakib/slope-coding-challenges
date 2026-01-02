FROM oven/bun:latest

# Install C++ compiler
RUN apt-get update && apt-get install -y g++ build-essential

WORKDIR /app

COPY . .

CMD ["bun", "run", "index.ts"]
