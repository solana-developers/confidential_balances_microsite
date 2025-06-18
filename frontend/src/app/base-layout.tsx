'use client'

import { ComponentProps, FC, PropsWithChildren, Suspense, useRef } from 'react'
import { Skeleton } from '@solana-foundation/ms-tools-ui/components/skeleton'
import { cn } from '@solana-foundation/ms-tools-ui/lib/utils'
import { useAtomValue } from 'jotai'
import { devModeOpenAtom, DevModePanel } from '@/entities/dev-mode'
import {
  OperationLogButton,
  OperationLogDrawer,
  operationLogOpenAtom,
} from '@/entities/operation-log'
import { WalletChecker } from '@/entities/wallet/checker'
import { Header } from '@/shared/ui/header'
import { StickyPanel } from '@/shared/ui/sticky-panel'

type LayoutProps = PropsWithChildren<{
  links: ComponentProps<typeof Header>['navigation']
}>

export const BaseLayout: FC<LayoutProps> = ({ children, links }) => {
  const ref = useRef<HTMLDivElement>(null)

  const devModeOpen = useAtomValue(devModeOpenAtom)
  const operationLogOpen = useAtomValue(operationLogOpenAtom)

  return (
    <>
      <div
        ref={ref}
        className={cn('flex h-full flex-col gap-12 overflow-y-auto', {
          'max-h-[calc(100%-394px)]': operationLogOpen,
        })}
      >
        <Header navigation={links} />
        <div className="mx-auto grid w-full max-w-7xl flex-grow grid-cols-12 gap-4 px-5">
          <div className={cn('pb-5', devModeOpen ? 'col-span-8 hidden md:block' : 'col-span-12')}>
            <WalletChecker>
              <Suspense
                fallback={
                  <div className="my-32 text-center">
                    <Skeleton className="m-auto h-6 w-[250px] px-4 text-(color:--surface)">
                      Loading..
                    </Skeleton>
                  </div>
                }
              >
                {children}
              </Suspense>
            </WalletChecker>
          </div>
          {devModeOpen && (
            <div className="col-span-12 -mt-12 md:col-span-4">
              <StickyPanel containerRef={ref}>
                <DevModePanel />
              </StickyPanel>
            </div>
          )}
        </div>
        <OperationLogButton />
      </div>

      <OperationLogDrawer />
    </>
  )
}
