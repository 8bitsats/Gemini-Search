# Build stage
FROM node:20.11.0-bullseye AS builder

WORKDIR /app

# Copy package files and configs
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY postcss.config.js ./
COPY tailwind.config.ts ./

# Copy only backend source files
COPY server/ ./server/
COPY db/ ./db/

# Install dependencies
RUN npm install

# Build backend only using esbuild with proper extension
RUN npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.mjs

# Production stage
FROM node:20.11.0-bullseye-slim

WORKDIR /app

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

# Set production environment
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 3000

# Start the application with the .mjs extension
CMD ["node", "dist/index.mjs"]
