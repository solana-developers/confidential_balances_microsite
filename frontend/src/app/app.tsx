'use client'

import { FC, type PropsWithChildren } from 'react'
import { ClusterProvider } from './cluster-provider'
import { SolanaProvider } from './solana-provider'
import { JotaiProvider, ReactQueryProvider } from './state-providers'

export const App: FC<PropsWithChildren> = ({ children }) => (
  <JotaiProvider>
    <ReactQueryProvider>
      <ClusterProvider>
        <SolanaProvider>4{children}</SolanaProvider>
      </ClusterProvider>
    </ReactQueryProvider>
  </JotaiProvider>
)
