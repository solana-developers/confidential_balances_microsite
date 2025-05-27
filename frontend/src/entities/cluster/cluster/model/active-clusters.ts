import { atom } from 'jotai'
import { Cluster } from '@/shared/solana'
import { clusterAtom } from './cluster'
import { clustersAtom } from './clusters'

export const activeClustersAtom = atom<Cluster[]>((get) => {
  const clusters = get(clustersAtom)
  const cluster = get(clusterAtom)

  return clusters.map((item) => ({
    ...item,
    active: item.name === cluster.name,
  }))
})
