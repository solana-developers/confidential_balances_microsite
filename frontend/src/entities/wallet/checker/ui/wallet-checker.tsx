import { FC, type PropsWithChildren } from 'react'
import { AccountChecker } from './account-checker'
import { ClusterChecker } from './cluster-checker'

type WalletCheckerProps = PropsWithChildren<{}>

export const WalletChecker: FC<WalletCheckerProps> = ({ children }) => (
  <>
    {children}

    <ClusterChecker>
      <AccountChecker />
    </ClusterChecker>
  </>
)
