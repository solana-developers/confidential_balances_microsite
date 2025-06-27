/// Health check endpoint
pub async fn health_check() -> &'static str {
    "OK"
}

/// Version check endpoint
pub async fn version_check() -> &'static str {
    "0.1.0"
}
