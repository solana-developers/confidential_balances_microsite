# Main Makefile for the frontend project

# Include other Makefiles
include Makefiles/storybook.mk

lint:
	@pnpm format --write
	@pnpm lint --fix

# Default help command
help:
	@echo "Application:"
	@echo "TODO: wip"
	@echo ""
	@echo "Storybook:"
	@echo "  make sb            - Start Storybook"

# Set default target
.DEFAULT_GOAL := help
