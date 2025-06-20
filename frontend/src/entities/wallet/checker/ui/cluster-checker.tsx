import { ComponentProps, FC, type PropsWithChildren } from 'react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@solana-foundation/ms-tools-ui/components/alert'
import { useConnection } from '@solana/wallet-adapter-react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { useCluster } from '@/shared/solana'
import { cn } from '@/shared/utils'

type ClusterCheckerProps = PropsWithChildren<{}> & ComponentProps<'div'>

export const ClusterChecker: FC<ClusterCheckerProps> = ({ children, className }) => {
  const { cluster } = useCluster()
  const { connection } = useConnection()

  const query = useQuery({
    queryKey: ['version', { cluster, endpoint: connection.rpcEndpoint }],
    queryFn: () => connection.getVersion(),
    retry: 1,
  })

  if (query.isLoading) return undefined

  return query.isError || !query.data ? (
    <Alert
      className={cn('z-50 max-h-16 cursor-pointer [&_svg]:shrink-0', className)}
      variant="error"
      onClick={() => query.refetch()}
    >
      <AlertTitle>
        Error connecting to cluster <strong>{cluster.name}</strong>
      </AlertTitle>
      <AlertDescription className="flex flex-nowrap items-center">
        Reconnect
        <ChevronRight className="size-4" />
      </AlertDescription>
    </Alert>
  ) : (
    children
  )
}
