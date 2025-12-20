#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing ALL dependencies (including dev)..."
npm install

echo "Installing Nest CLI globally (just in case)..."
npm install -g @nestjs/cli

echo "Building application..."
npm run build

echo "Listing dist directory to verify build..."
ls -la dist

echo "Running migrations..."
npx prisma migrate deploy

echo "Build and Migration successful!"
