/**
 * Helper function to calculate UI amount from lamports using mint decimals
 * Handles large numbers safely using BigInt and provides proper error handling
 */
export function calculateUiAmount(amountString: string, decimals: number): string {
  try {
    // Parse the amount as a BigInt to handle large numbers safely
    const amountBigInt = BigInt(amountString)

    if (!Number.isInteger(decimals)) {
      throw new Error(`Invalid decimals: ${decimals}`)
    }

    // Calculate the divisor using 10^decimals (keeping BigInt for precision)
    const divisor = BigInt(Math.pow(10, decimals))

    // Perform integer division to get the whole part
    const wholePart = amountBigInt / divisor

    // Calculate the remainder for the fractional part
    const remainder = amountBigInt % divisor

    // If there's no fractional part, return just the whole number
    if (remainder === BigInt(0)) {
      return wholePart.toString()
    }

    // Convert remainder to string and pad with leading zeros to match decimal places
    const remainderStr = remainder.toString().padStart(decimals, '0')

    // Remove trailing zeros from the fractional part for cleaner display
    const trimmedRemainder = remainderStr.replace(/0+$/, '')

    // If all fractional digits were zeros, return just the whole part
    if (trimmedRemainder === '') {
      return wholePart.toString()
    }

    // Combine whole and fractional parts
    return `${wholePart.toString()}.${trimmedRemainder}`
  } catch (error) {
    console.error('Error calculating UI amount:', error)

    // Fallback to regular number parsing if BigInt fails
    try {
      const amount = parseFloat(amountString)
      return (amount / Math.pow(10, decimals)).toString()
    } catch (fallbackError) {
      console.error('Fallback calculation also failed:', fallbackError)
      return '-'
    }
  }
}
