FROM oven/bun:latest

# Install Python
RUN apt-get update && apt-get install -y python3 python3-pip

WORKDIR /app

COPY . .

CMD ["bun", "run", "index.ts"]
