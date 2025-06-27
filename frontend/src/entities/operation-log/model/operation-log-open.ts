import { atomWithStorage } from 'jotai/utils'

export const operationLogOpenAtom = atomWithStorage<boolean>('operation-log-open', false)
