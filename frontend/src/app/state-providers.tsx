'use client'

import React, { FC, PropsWithChildren, ReactNode, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryStreamedHydration } from '@tanstack/react-query-next-experimental'
import { Provider } from 'jotai'
import { jotai, queryClient } from '@/shared/state'

export const JotaiProvider: FC<PropsWithChildren> = ({ children }) => (
  <Provider store={jotai}>{children}</Provider>
)

export const ReactQueryProvider: FC<PropsWithChildren> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <ReactQueryStreamedHydration>{children}</ReactQueryStreamedHydration>
  </QueryClientProvider>
)
