import { useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Dialog, DialogPanel } from '@headlessui/react'
import { cva } from 'class-variance-authority'
import * as Icons from 'lucide-react'
import { WalletButton } from '@/app/providers/solana-provider'
import { ClusterSelect } from '@/entities/cluster/cluster'
import { DevModeButton } from '@/entities/dev-mode'
import { cn } from '@/shared/utils'
import { Logo } from './logo'

type Link = { label: string; path: string; blank?: boolean }

const themeVariants = cva('text-white font-(family-name:--font-family-inter)', {
  variants: {
    theme: {
      dark: 'border-(color:--border) border-b bg-[var(--background)]',
    },
  },
  defaultVariants: {
    theme: 'dark',
  },
})

export function Header({ navigation }: { navigation: Link[] }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const themeCls = useMemo(() => themeVariants({ theme: 'dark' }), [])

  return (
    <>
      <header className={themeCls}>
        {/* fix height for header to make logo at the mobile sidebar match the position of default logo */}
        <nav
          aria-label="Global"
          className="mx-auto flex h-[3.75rem] max-w-7xl items-center justify-between px-5 py-3"
        >
          <Logo pathname={pathname} />
          <div className="flex lg:hidden">
            <span className="mr-2 ml-4">
              <WalletButton />
            </span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="-m-2.5 inline-flex cursor-pointer items-center justify-center rounded-md p-2.5 text-gray-700"
            >
              <span className="sr-only">Open main menu</span>
              <Icons.Menu aria-hidden="true" className="size-6" />
            </button>
          </div>
          <MainMenu className="hidden lg:flex lg:gap-x-2" navigation={navigation} />
        </nav>
        <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
          <div className="fixed inset-0 z-10" />
          {/* set specific pt- for dialog panel to match the default logo*/}
          <DialogPanel
            className={cn(
              'fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-inherit px-5 py-5 pt-[1.125rem] sm:max-w-sm sm:ring-1 sm:ring-gray-900/10',
              themeCls
            )}
          >
            <div className="flex items-center justify-between">
              <Logo pathname={pathname} />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
              >
                <span className="sr-only">Close menu</span>
                <Icons.CircleX aria-hidden="true" className="size-6" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <DialogMenu navigation={navigation} />
            </div>
          </DialogPanel>
        </Dialog>
      </header>
    </>
  )
}

function MainMenu({
  className,
  navigation,
}: React.HTMLAttributes<HTMLDivElement> & { navigation: Link[] }) {
  return (
    <>
      <div className={cn('items-center', className)}>
        {navigation.map((item) => (
          <a
            key={item.label}
            href={item.path}
            target={item.blank ? '_blank' : '_self'}
            className="min-h-[22px] items-center px-4 py-2 text-sm leading-[22px]!"
          >
            {item.label}
          </a>
        ))}
        <DevModeButton />
        <ClusterSelect />
        <div className="min-w-[118px]">
          <WalletButton />
        </div>
      </div>
    </>
  )
}

function DialogMenu({ navigation }: { navigation: Link[] }) {
  return (
    <div className="-my-6 divide-y divide-gray-500/10">
      <div className="space-y-2 py-6">
        {navigation.map((item) => (
          <a
            key={item.label}
            href={item.path}
            target={item.blank ? '_blank' : '_self'}
            rel={item.blank ? 'noopener noreferrer' : undefined}
            className="hover:bg-accent min-h[20px] -mx-3 block rounded-lg px-3 py-2 text-base/7 leading-[24px]!"
          >
            {item.label}{' '}
            {item.blank ? (
              <Icons.ExternalLink
                className="inline translate-x-[2px] translate-y-[-2px]"
                size="14"
              />
            ) : (
              ''
            )}
          </a>
        ))}

        {/* NOTE: I've limited width for ClusterSelector to match DevMode, but we have to tweak dropdown size for clusters as Badge does not fit */}
        <DevModeButton />
        <div className="w-[125px]">
          <ClusterSelect />
        </div>
      </div>
      {/* here might be other elements that will be separated with a gray line */}
    </div>
  )
}
