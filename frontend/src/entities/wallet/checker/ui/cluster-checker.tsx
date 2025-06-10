import { FC, type PropsWithChildren } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { useQuery } from '@tanstack/react-query'
import { useCluster } from '@/shared/solana'

type ClusterCheckerProps = PropsWithChildren<{}>

export const ClusterChecker: FC<ClusterCheckerProps> = ({ children }) => {
  const { cluster } = useCluster()
  const { connection } = useConnection()

  const query = useQuery({
    queryKey: ['version', { cluster, endpoint: connection.rpcEndpoint }],
    queryFn: () => connection.getVersion(),
    retry: 1,
  })

  if (query.isLoading) return undefined

  return query.isError || !query.data ? (
    <div className="alert alert-warning text-warning-content/80 flex justify-center rounded-none">
      <span>
        Error connecting to cluster <strong>{cluster.name}</strong>
      </span>
      <button className="btn btn-xs btn-neutral" onClick={() => query.refetch()}>
        Refresh
      </button>
    </div>
  ) : (
    children
  )
}
