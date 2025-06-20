import { FC, type PropsWithChildren } from 'react'
import { AccountChecker } from './account-checker'
import { ClusterChecker } from './cluster-checker'

type WalletCheckerProps = PropsWithChildren<{}>

export const WalletChecker: FC<WalletCheckerProps> = ({ children }) => (
  <>
    {children}

    <ClusterChecker className="color-red fixed top-4! left-1/2 z-50 max-w-sm -translate-x-1/2">
      <AccountChecker />
    </ClusterChecker>
  </>
)
