import { LAMPORTS_PER_SOL, TokenAmount } from '@solana/web3.js'

const decimals = Math.log10(LAMPORTS_PER_SOL)

export function nativeToUiAmount(balance: number): TokenAmount {
  const amount = balance / LAMPORTS_PER_SOL

  return {
    amount: String(amount),
    decimals,
    uiAmount: amount,
    uiAmountString: amount.toFixed(decimals),
  }
}

export const emptyNativeBalance = (defaultAmount: number = 0): TokenAmount => ({
  amount: String(defaultAmount),
  decimals,
  uiAmount: defaultAmount,
  uiAmountString: String(defaultAmount),
})
