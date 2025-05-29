import { LAMPORTS_PER_SOL } from '@solana/web3.js'

export function nativeToUiAmount(balance: number) {
  const amount = balance / LAMPORTS_PER_SOL
  const decimals = Math.round(Math.log(LAMPORTS_PER_SOL) / Math.log(10))

  return {
    uiAmount: amount,
    uiAmountString: amount.toFixed(decimals),
  }
}
