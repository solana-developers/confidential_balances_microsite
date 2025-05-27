import { atomWithStorage } from 'jotai/utils'
import { Cluster } from '@/shared/solana'
import { defaultClusters } from './default-clusters'

export const clustersAtom = atomWithStorage<Cluster[]>('solana-clusters', defaultClusters)
