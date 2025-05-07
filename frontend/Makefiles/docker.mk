# Docker commands for the frontend

# Variables
DOCKER_COMPOSE_FILE := docker/docker-compose.yml
IMAGE_NAME := frontend-nextjs
TAG := latest

# Build commands
docker-build:
	@echo "Building Docker image..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) build

# Container management commands
docker-up:
	@echo "Starting application in the background..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) up -d

docker-down:
	@echo "Stopping application..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) down

# Logging and monitoring commands
docker-logs:
	@echo "Showing application logs..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) logs -f

status:
	@echo "Showing status of Docker Compose containers..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) ps

# Cleanup commands
docker-clean:
	@echo "Cleaning up resources..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) down --rmi local
	docker system prune -f 