'use client'

import { FC, type PropsWithChildren } from 'react'
import { Toaster } from '@hoodieshq/ms-tools-ui'
import { ClusterProvider } from './cluster-provider'
import { SolanaProvider } from './solana-provider'
import { JotaiProvider, ReactQueryProvider } from './state-providers'

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
