import { useWallet } from '@solana/wallet-adapter-react'
import { AccountBalanceCheck } from './account-balance-check'

// TODO: support this logic at OmniAccountHeader
export const AccountChecker = () => {
  const { publicKey } = useWallet()
  if (!publicKey) {
    return null
  }
  return <AccountBalanceCheck address={publicKey} />
}
