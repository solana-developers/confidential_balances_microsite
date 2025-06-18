import { ComponentProps, FC } from 'react'
import { useCluster } from '@/shared/solana/cluster'
import { cn } from '@/shared/utils'

type ExplorerLinkProps = Pick<ComponentProps<'div'>, 'className'> & {
  path: string
  label: string
}

export const ExplorerLink: FC<ExplorerLinkProps> = ({ path, label, className }) => {
  const { getExplorerUrl } = useCluster()
  return (
    <a
      href={getExplorerUrl(path)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('font-mono', className)}
    >
      {label}
    </a>
  )
}
