// Health check endpoint
pub async fn health_check() -> &'static str {
    "OK"
}

// Hello world endpoint
pub async fn hello_world() -> &'static str {
    "Hello, World!"
} 