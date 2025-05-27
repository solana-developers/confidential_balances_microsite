import { atom } from 'jotai'
import { Cluster } from '@/shared/solana'
import { activeClustersAtom } from './active-clusters'

export const activeClusterAtom = atom<Cluster>((get) => {
  const clusters = get(activeClustersAtom)

  return clusters.find((item) => item.active) || clusters[0]
})
