#!/bin/bash
set -e

# Detect if running on Apple Silicon
if [[ $(uname -m) == 'arm64' ]]; then
  echo "Detected Apple Silicon (ARM64) architecture"
  # For local testing, you can use ARM64
  LOCAL_PLATFORM_FLAG="--platform linux/arm64"
  # For production/Cloud Run, always use AMD64
  BUILD_PLATFORM_FLAG="--platform linux/amd64"
else
  LOCAL_PLATFORM_FLAG=""
  BUILD_PLATFORM_FLAG=""
fi

# Choose between development or production builds
if [[ "$1" == "--prod" || "$1" == "-p" ]]; then
  echo "Building production image for Cloud Run (AMD64 architecture)..."
  PLATFORM_FLAG="$BUILD_PLATFORM_FLAG"
  IMAGE_TAG="solana-backend:prod"
else
  echo "Building local development image..."
  PLATFORM_FLAG="$LOCAL_PLATFORM_FLAG"
  IMAGE_TAG="solana-backend:dev"
fi

echo "Building Docker image..."
docker build $PLATFORM_FLAG -t $IMAGE_TAG . || {
  echo "Docker build failed. For more detailed logs, try:"
  echo "docker build $PLATFORM_FLAG -t $IMAGE_TAG . --progress=plain --no-cache"
  exit 1
}

echo "Running container locally on port 3003..."
docker run $PLATFORM_FLAG -p 3003:3003 -e PORT=3003 $IMAGE_TAG

# If this is a production build, output the command to push to Cloud Run
if [[ "$1" == "--prod" || "$1" == "-p" ]]; then
  echo ""
  echo "To push this image to Google Cloud, run:"
  echo "docker tag $IMAGE_TAG us-central1-docker.pkg.dev/microsite-453317/solana-backend/api:latest"
  echo "docker push us-central1-docker.pkg.dev/microsite-453317/solana-backend/api:latest"
fi 