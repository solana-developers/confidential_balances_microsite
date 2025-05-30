import { FC, type PropsWithChildren } from 'react'
import * as Icons from 'lucide-react'
import { cn } from '@/shared/utils/cn'

type PanelProps = PropsWithChildren<{
  className?: string
  title: string
  onClose: () => void | Promise<void>
}>

export const Panel: FC<PanelProps> = ({ children, className, title, onClose }) => (
  <section
    className={cn(
      'h-full border-t border-r border-b border-l border-[var(--border)] bg-[var(--table-background)] select-none',
      className
    )}
  >
    <header className="flex items-center gap-4 border-b border-[var(--border)] px-6 py-4">
      <h3 className="flex-1 overflow-hidden font-medium tracking-[-0.01875rem] text-ellipsis whitespace-nowrap text-[var(--foreground)]">
        {title}
      </h3>
      {onClose && (
        <button className="shrink-0 cursor-pointer" onClick={onClose}>
          <Icons.X className="size-6 fill-[var(--foreground)]" />
        </button>
      )}
    </header>
    <div className="flex max-h-full flex-col divide-y divide-[var(--border)] overflow-y-auto">
      {children}
    </div>
  </section>
)
