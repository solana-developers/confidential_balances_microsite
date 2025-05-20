# Run storybook for UI-kit
sb:
	@echo "Launching @solana/ms-tools-ui storybook..."
	@pnpm --filter @solana/ms-tools-ui storybook

# Script to allow generating boilerplate for UI-kit. Will be removed later on replacing UI-kit with external one
generate:
	@pnpm --filter @solana/ms-tools-ui run generate
