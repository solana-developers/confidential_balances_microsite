# Main Makefile for the frontend project

# Include other Makefiles
include Makefiles/docker.mk
include Makefiles/App.mk

# Build target (for convenient access to docker-build)
build: docker-build

# Default help command
help:
	@echo "Docker Commands:"
	@echo "  make build        - Build Docker image"
	@echo "  make docker-up    - Start the application in the background"
	@echo "  make docker-down  - Stop the application"
	@echo "  make docker-logs  - Show application logs"
	@echo "  make docker-clean - Stop the application and remove images"
	@echo ""
	@echo "Application Commands:"
	@echo "  make app-up       - Start application container"
	@echo "  make app-shell    - Open shell in the application container"
	@echo "  make app-down     - Stop application container"
	@echo "  make app-stop     - Stop the application inside container"
	@echo "  make app-install  - Install packages using pnpm"
	@echo "  make app-start    - Start the development server with pnpm dev"
	@echo "  make app-status   - Show processes running inside container"
	@echo ""
	@echo "Project Commands:"
	@echo "  make status       - Show status of Docker Compose containers"
	@echo "  make help         - Show this help message"

# Set default target
.DEFAULT_GOAL := help 