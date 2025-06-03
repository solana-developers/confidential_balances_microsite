'use client'

import { FC, use, useEffect, useMemo, useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { OperationLogDrawer as OperationLogDrawerBase } from '@/shared/ui/operation-log-drawer'
import { MAX_LOG_ITEMS, operationLogAtom, OperationLogItem } from '../model/operation-log-items'
import { operationLogOpenAtom } from '../model/operation-log-open'

export const OperationLogDrawer: FC = () => {
  const [operationLogOpen, setOperationLogOpen] = useAtom(operationLogOpenAtom)

  const [log, setLog] = useAtom(operationLogAtom)
  const items = useMemo<OperationLogItem[]>(
    () =>
      log.length < MAX_LOG_ITEMS
        ? [
            {
              title: 'Welcome to Solana Confidential Balances operation log!',
              content: `Here, you'll find a transparent record of all your recent activity.\nEvery operation you approve will be logged here for your reference.`,
              variant: 'muted',
            },
            ...log,
          ]
        : log,
    [log]
  )

  return (
    <OperationLogDrawerBase
      open={operationLogOpen}
      items={items}
      onClose={() => setOperationLogOpen(false)}
      onClear={() => setLog([])}
    />
  )
}
