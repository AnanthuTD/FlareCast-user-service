# Stage 1: Build Stage
FROM node:22.12.0-alpine AS build

# Set working directory
WORKDIR /usr/src/app

# Copy only package.json
COPY package.json pnpm-lock.yaml ./

# Enable and install dependencies
RUN corepack enable pnpm && pnpm i typescript

# Copy the rest of the application code
COPY . .

# Compile TypeScript
RUN pnpm tsc || true

# Stage 2: Production Image
FROM node:22.12.0-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy only necessary files from the build stage
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package.json .
COPY --from=build /usr/src/app/pnpm-lock.yaml .
COPY --from=build /usr/src/app/prisma ./prisma/

# Enable pnpm and install production dependencies
RUN corepack enable pnpm && pnpm install --prod && npx prisma generate

# Expose the desired port
EXPOSE 4001

# Add healthcheck (optional)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD curl -f http://localhost:4001 || exit 1

# Start the application
CMD [ "pnpm", "start" ]
