import { atomWithStorage } from 'jotai/utils'

export const devModeOpenAtom = atomWithStorage<boolean>('dev-mode-open', false)
