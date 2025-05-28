'use client'

import { ComponentProps, FC, PropsWithChildren, Suspense } from 'react'
import { Toaster } from 'react-hot-toast'
import { AccountChecker } from '@/entities/account/account'
import { ClusterChecker } from '@/entities/cluster/cluster'
import { Header } from '@/shared/ui/header'

type LayoutProps = PropsWithChildren<{
  links: ComponentProps<typeof Header>['navigation']
}>

export const Layout: FC<LayoutProps> = ({ children, links }) => {
  //   const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-12">
      <Header navigation={links} />
      {/* <div className="navbar bg-base-300 dark:text-neutral-content flex-col md:flex-row space-y-2 md:space-y-0">
          <div className="flex-1">
            <Link className="btn btn-ghost normal-case text-xl" href="/">
              Confidental Balances Microsite
            </Link>
            <ul className="menu menu-horizontal px-1 space-x-2">
              {links.map(({ label, path }) => (
                <li key={path}>
                  <Link
                    className={pathname.startsWith(path) ? "active" : ""}
                    href={path}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-none space-x-2">
            <WalletButton />
            <ClusterUiSelect />
          </div>
        </div> */}
      <div className="mx-auto w-full max-w-7xl flex-grow px-5">
        <ClusterChecker>
          <AccountChecker />
        </ClusterChecker>
        <Suspense
          fallback={
            <div className="my-32 text-center">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          }
        >
          {children}
        </Suspense>
      </div>
      <Toaster position="bottom-right" />
    </div>
  )
}
