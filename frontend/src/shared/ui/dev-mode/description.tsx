import { FC } from 'react'

export const Description: FC = () => (
  <div className="flex flex-col gap-1 px-6 py-4 select-none">
    <h3 className="text-sm font-medium tracking-[-0.04375rem] text-[var(--foreground)]">
      Welcome to Solana Confidential Balances dev mode!
    </h3>
    <div className="flex flex-col gap-1 text-xs tracking-[-0.04375rem] text-[var(--foreground)]/50">
      <p>
        Explore confidential balances end-to-end—each demo microsite action is auto-logged for easy
        progress tracking.
      </p>
      <p>
        Need mode? Check the{' '}
        <a href="#" className="text-[var(--accent-secondary)] hover:underline">
          documentation
        </a>
        .
      </p>
      <p>Note: CLI commands and outputs are demo-only.</p>
    </div>
  </div>
)
