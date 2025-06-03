'use client'

import { FC, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Button } from '@hoodieshq/ms-tools-ui'
import * as Icons from 'lucide-react'
import { Drawer } from 'vaul'
import { LogItem, LogItemResult } from '@/shared/ui/log'
import { cn } from '@/shared/utils'
import { useKeepScrollBottom } from './use-keep-scroll-bottom'
import styles from './operation-log-drawer.module.css'

const snapPoints = ['393px', 0.7, 1]

type OperationLogDrawerProps = {
  open: boolean
  items: {
    title: string
    content: string
    variant: 'success' | 'error' | 'muted'
  }[]
  onClose?: () => void
  onClear?: () => void
}

export const OperationLogDrawer: FC<OperationLogDrawerProps> = ({
  open,
  items,
  onClose,
  onClear,
}) => {
  const [scrollableRef, setScrollableRef] = useState<HTMLDivElement | null>(null)
  const [snap, setSnap] = useState<number | string | null>(snapPoints[0])

  useEffect(() => {
    if (open) {
      const timeout = setTimeout(() => {
        // Workaround for preventing pointer events disable on body when drawer is opened
        document.body.style.pointerEvents = ''
      }, 0)
      return () => clearTimeout(timeout)
    }
  }, [open])

  const [isFollowing, setIsFollowing] = useState<boolean>(true)
  useKeepScrollBottom(isFollowing, scrollableRef)

  return (
    <Drawer.Root
      open={open}
      onClose={onClose}
      modal={false}
      noBodyStyles={true}
      snapPoints={snapPoints}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
    >
      <Drawer.Portal>
        <Drawer.Content
          data-slot="drawer-content"
          className="border-b-none fixed right-0 bottom-0 left-0 mx-[-1px] flex h-full max-h-[100%] flex-col border border-[var(--border)] bg-[var(--table-background)]"
        >
          <div className="relative flex flex-nowrap items-center gap-4 border-b px-6 py-3">
            <Drawer.Title className="flex-1 overflow-hidden leading-none font-medium tracking-[-0.01875rem] text-ellipsis whitespace-nowrap text-[var(--foreground)]">
              Operation Log
            </Drawer.Title>
            <div className="flex shrink-0 flex-nowrap items-center gap-6">
              <div className="flex flex-nowrap gap-2">
                {!isFollowing && (
                  <Button variant="outline" size="sm" onClick={() => setIsFollowing(true)}>
                    <Icons.ArrowDownToLine />
                    Follow
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={onClear}>
                  <Icons.Eraser />
                  Clear log
                </Button>
              </div>
              <Drawer.Close asChild>
                <button className="shrink-0 cursor-pointer">
                  <Icons.X className="size-6 fill-[var(--foreground)]" />
                </button>
              </Drawer.Close>
            </div>
            <div className="absolute top-2 left-1/2 h-1 w-15 -translate-x-1/2 rounded-full bg-[var(--muted-foreground)]"></div>
          </div>

          <div
            ref={setScrollableRef}
            className={cn(
              'flex-1 snap-y overflow-x-hidden overflow-y-auto scroll-smooth p-0',
              snap === 1
                ? 'max-h-[calc(100vh-50px)]'
                : snap === 0.7
                  ? 'max-h-[calc(70vh-50px)]'
                  : 'max-h-[342px]',
              styles.content
            )}
            onWheel={() => setIsFollowing(false)}
            onMouseDown={() => setIsFollowing(false)}
          >
            {items.map((item, index) => (
              <LogItem key={index} className="snap-start" title={item.title} variant={item.variant}>
                <LogItemResult variant={item.variant}>{item.content}</LogItemResult>
              </LogItem>
            ))}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
