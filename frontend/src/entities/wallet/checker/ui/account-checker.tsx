import { FC, PropsWithChildren } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { AccountBalanceChecker } from './account-balance-checker'

type AccountCheckerProps = PropsWithChildren

// TODO: support this logic at OmniAccountHeader
export const AccountChecker: FC<AccountCheckerProps> = ({ children }) => {
  const { publicKey } = useWallet()
  return publicKey ? <AccountBalanceChecker address={publicKey} /> : children
}
