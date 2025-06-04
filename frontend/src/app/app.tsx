'use client'

import { FC, type PropsWithChildren } from 'react'
import { Toaster } from '@hoodieshq/ms-tools-ui'
import { ClusterProvider } from '../features/cluster-provider'
import { SolanaProvider } from '../features/solana-provider'
import { JotaiProvider, ReactQueryProvider } from '../features/state-providers'

export const App: FC<PropsWithChildren> = ({ children }) => (
  <JotaiProvider>
    <ReactQueryProvider>
      <ClusterProvider>
        <SolanaProvider>
          {children}
          <Toaster position="bottom-center" />
        </SolanaProvider>
      </ClusterProvider>
    </ReactQueryProvider>
  </JotaiProvider>
)
