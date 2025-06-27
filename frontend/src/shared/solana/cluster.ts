'use client'

import { createContext, useContext } from 'react'

// By default, we don't configure the mainnet-beta cluster
// The endpoint provided by clusterApiUrl('mainnet-beta') does not allow access from the browser due to CORS restrictions
// To use the mainnet-beta cluster, provide a custom endpoint

export type Cluster = {
  name: string
  endpoint: string
  network?: ClusterNetwork
  active?: boolean
}

/* eslint-disable no-unused-vars */
export enum ClusterNetwork {
  Mainnet = 'mainnet-beta',
  Testnet = 'testnet',
  Devnet = 'devnet',
  Custom = 'custom',
}
/* eslint-enable no-unused-vars */

export type ClusterProviderContext = {
  cluster: Cluster
  clusters: Cluster[]
  addCluster: (_cluster: Cluster) => void
  deleteCluster: (_cluster: Cluster) => void
  setCluster: (_cluster: Cluster) => void
  getExplorerUrl(_path: string): string
}

export const ClusterContext = createContext<ClusterProviderContext>({} as ClusterProviderContext)

export const useCluster = () => useContext(ClusterContext)

export const getClusterUrlParam = (cluster: Cluster): string => {
  let suffix = ''
  switch (cluster.network) {
    case ClusterNetwork.Devnet:
      suffix = 'devnet'
      break
    case ClusterNetwork.Mainnet:
      suffix = ''
      break
    case ClusterNetwork.Testnet:
      suffix = 'testnet'
      break
    default:
      suffix = `custom&customUrl=${encodeURIComponent(cluster.endpoint)}`
      break
  }

  return suffix.length ? `?cluster=${suffix}` : ''
}
