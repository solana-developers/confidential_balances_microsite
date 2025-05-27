import { atomWithStorage } from 'jotai/utils'
import { Cluster } from '@/shared/solana'
import { defaultClusters } from './default-clusters'

export const clusterAtom = atomWithStorage<Cluster>('solana-cluster', defaultClusters[0])
