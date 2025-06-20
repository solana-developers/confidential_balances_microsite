import { FC, PropsWithChildren } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { AccountBalanceChecker } from './account-balance-checker'

type AccountCheckerProps = PropsWithChildren

export const AccountChecker: FC<AccountCheckerProps> = ({ children }) => {
  const { publicKey } = useWallet()
  return publicKey ? (
    <AccountBalanceChecker
      className="color-red fixed top-4! left-1/2 z-50 max-w-sm -translate-x-1/2"
      address={publicKey}
    />
  ) : (
    children
  )
}
