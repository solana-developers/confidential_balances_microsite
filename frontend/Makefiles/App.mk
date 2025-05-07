# Application container management commands

# Variables
DOCKER_COMPOSE_FILE := docker/docker-compose.yml
SERVICE_NAME := nextjs

# Container management commands
app-up:
	@echo "Starting application container..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) up -d

app-down:
	@echo "Stopping application container..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) down

app-stop:
	@echo "Stopping all node processes inside container..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) exec $(SERVICE_NAME) pkill -f node || true

# Development commands
app-shell:
	@echo "Opening shell in the application container..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) exec $(SERVICE_NAME) sh

app-install:
	@echo "Installing packages inside container..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) exec $(SERVICE_NAME) yarn install
	docker-compose -f $(DOCKER_COMPOSE_FILE) exec $(SERVICE_NAME) yarn add -D tailwindcss@^3.4.1

app-clean-next:
	@echo "Cleaning nextjs cache..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) exec $(SERVICE_NAME) rm -rf .next/

app-start:
	@echo "Starting the development server..."
	make app-up
	make app-install
	docker-compose -f $(DOCKER_COMPOSE_FILE) exec $(SERVICE_NAME) rm -rf .next/ && yarn dev

# Monitoring commands
app-status:
	@echo "Showing processes running inside the container..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) exec $(SERVICE_NAME) ps aux 