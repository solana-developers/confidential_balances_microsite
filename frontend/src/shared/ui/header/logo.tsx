import { ComponentProps } from 'react'
import Link from 'next/link'

export function Logo({
  href = '/',
  pathname,
  ...props
}: { pathname: string | null; href?: string } & ComponentProps<'a'>) {
  const isLink = pathname && pathname !== href
  const Comp = isLink ? Link : 'span'

  return (
    <Comp href={isLink ? href : '/'} className="-m-1.5 p-1.5" {...props}>
      <span className="sr-only">Confidential Balances Demo</span>
      <span className="flex items-start gap-[12px]">
        {/* eslint-disable @next/next/no-img-element */}
        <img
          alt="Solana"
          loading="lazy"
          src="/solana_1x.png"
          srcSet="/solana_2x.png 2x"
          className="h-[12px] w-auto max-w-none"
        />
        <img
          alt="Confidential Balances Demo"
          loading="lazy"
          src="/logo_1x.png"
          srcSet="/logo_2x.png 2x"
          className="hidden h-[14px] w-auto max-w-none sm:block"
        />
        {/* eslint-enable @next/next/no-img-element */}
      </span>
    </Comp>
  )
}
