# Use a more recent official Rust image AS a builder
FROM rust:1.84 AS builder

# Install the nightly toolchain
RUN rustup default nightly

# Install system dependencies required for building
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    pkg-config \
    libudev-dev \
    libusb-1.0-0-dev \
    && rm -rf /var/lib/apt/lists/*

# Create a new empty shell project
WORKDIR /usr/src/app
COPY . .

# Build the application with release profile
RUN cargo build --release

# Use a slim image for the runtime
FROM debian:bookworm-slim

# Install necessary dependencies for runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libudev1 \
    libusb-1.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy the binary from the builder stage
COPY --from=builder /usr/src/app/target/release/confidential-balances-api-server /usr/local/bin/

# Make the binary executable (just to be safe)
RUN chmod +x /usr/local/bin/confidential-balances-api-server

# Verify the binary is compatible with the system
RUN ldd /usr/local/bin/confidential-balances-api-server || true

# Set the startup command
CMD ["confidential-balances-api-server"]
