# Base image
FROM node:16-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./

RUN npm ci --legacy-peer-deps

# Add source code
COPY . .

# Build TypeScript project
RUN npm run build

# Production stage
FROM node:16-alpine AS prod

# Set working directory
WORKDIR /app

# Copy built TypeScript files from base image
COPY --from=base /app/dist ./dist
COPY package*.json ./
COPY --from=base /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY node_modules/@prisma ./node_modules/@prisma

COPY node_modules/@prisma ./node_modules/@prisma

# Install production dependencies only
RUN npm install --production

# Start server
CMD ["npm", "start"]
