'use client'

import { FC, PropsWithChildren } from 'react'
import { Connection } from '@solana/web3.js'
import { useAtomValue, useSetAtom } from 'jotai'
import toast from 'react-hot-toast'
import {
  activeClusterAtom,
  activeClustersAtom,
  clusterAtom,
  clustersAtom,
} from '@/entities/cluster/cluster'
import {
  ClusterContext,
  ClusterProviderContext,
  getClusterUrlParam,
  type Cluster,
} from '@/shared/solana'

export const ClusterProvider: FC<PropsWithChildren> = ({ children }) => {
  const cluster = useAtomValue(activeClusterAtom)
  const clusters = useAtomValue(activeClustersAtom)
  const setCluster = useSetAtom(clusterAtom)
  const setClusters = useSetAtom(clustersAtom)

  const value: ClusterProviderContext = {
    cluster,
    clusters: clusters.sort((a, b) => (a.name > b.name ? 1 : -1)),
    addCluster: (cluster: Cluster) => {
      try {
        new Connection(cluster.endpoint)
        setClusters([...clusters, cluster])
      } catch (err) {
        toast.error(`${err}`)
      }
    },
    deleteCluster: (cluster: Cluster) => {
      setClusters(clusters.filter((item) => item.name !== cluster.name))
    },
    setCluster: (cluster: Cluster) => setCluster(cluster),
    getExplorerUrl: (path: string) =>
      `https://explorer.solana.com/${path}${getClusterUrlParam(cluster)}`,
  }
  return <ClusterContext.Provider value={value}>{children}</ClusterContext.Provider>
}
