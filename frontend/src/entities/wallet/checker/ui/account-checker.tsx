import { FC, PropsWithChildren } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { AccountBalanceChecker } from './account-balance-checker'

type AccountCheckerProps = PropsWithChildren

export const AccountChecker: FC<AccountCheckerProps> = ({ children }) => {
  const { publicKey } = useWallet()
  return publicKey ? <AccountBalanceChecker address={publicKey} /> : children
}
