'use client'

import { ComponentProps, FC, PropsWithChildren, Suspense } from 'react'
import { cn, Skeleton } from '@hoodieshq/ms-tools-ui'
import { useAtomValue } from 'jotai'
import { Toaster } from 'react-hot-toast'
import { AccountChecker } from '@/entities/account/account'
import { ClusterChecker } from '@/entities/cluster/cluster'
import { devModeOpenAtom, DevModePanel } from '@/entities/dev-mode'
import { Header } from '@/shared/ui/header'

type LayoutProps = PropsWithChildren<{
  links: ComponentProps<typeof Header>['navigation']
}>

export const Layout: FC<LayoutProps> = ({ children, links }) => {
  const devModeOpen = useAtomValue(devModeOpenAtom)

  return (
    <div className="flex h-full flex-col gap-12">
      <Header navigation={links} />
      <div className="mx-auto grid w-full max-w-7xl flex-grow grid-cols-12 gap-4 px-5">
        <div className={cn(devModeOpen ? 'col-span-8 hidden md:block' : 'col-span-12')}>
          <ClusterChecker>
            <AccountChecker />
          </ClusterChecker>
          <Suspense
            fallback={
              <div className="my-32 text-center">
                <Skeleton className="m-auto h-6 w-[250px] text-(color:--surface)">
                  Loading..
                </Skeleton>
              </div>
            }
          >
            {children}
          </Suspense>
        </div>
        {devModeOpen && (
          <div className="col-span-12 -mt-12 md:col-span-4">
            <DevModePanel />
          </div>
        )}
      </div>
      <Toaster position="bottom-right" />
    </div>
  )
}
