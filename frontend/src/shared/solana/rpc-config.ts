/**
 * Shared configuration for Solana RPC requests
 * Used across hooks to ensure consistent behavior
 */

/** Default refresh interval for queries in milliseconds (12 seconds) */
export const RPC_REFRESH_TIMEOUT = 12_000

/** Default number of retries for failed RPC requests */
export const RPC_NUMBER_OF_RETRIES = 3

/** Default stale time for queries in milliseconds (5 seconds) */
export const RPC_STALE_TIME = 5_000
