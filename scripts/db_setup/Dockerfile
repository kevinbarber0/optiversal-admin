# Base image
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
COPY seed.js ./
COPY data ./data/

RUN npm ci
