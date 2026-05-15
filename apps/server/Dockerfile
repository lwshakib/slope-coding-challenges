FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./package.json
COPY --from=builder /app/apps/server/problems-data ./problems-data
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 8000
CMD ["npm", "start"]
