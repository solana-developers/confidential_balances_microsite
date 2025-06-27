import { atom, useSetAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7
export type DevModeItem = {
  title: string
  result: string
  success: boolean
}

export const devModeItemsAtom = atomWithStorage<Map<Step, DevModeItem>>(
  'dev-mode-items',
  new Map(),
  {
    getItem: (key, initialValue) => {
      const stored = localStorage.getItem(key)
      if (!stored) return initialValue
      try {
        return new Map<Step, DevModeItem>(JSON.parse(stored))
      } catch {
        return initialValue
      }
    },
    setItem: (key, value) => {
      const arr = Array.from(value.entries())
      localStorage.setItem(key, JSON.stringify(arr))
    },
    removeItem: (key) => {
      localStorage.removeItem(key)
    },
  }
)

const setDevModeItemAtom = atom(null, (get, set, step: Step, item: DevModeItem) => {
  const prev = get(devModeItemsAtom)
  const next = new Map(prev)
  next.set(step, item)
  set(devModeItemsAtom, next)
})

export const useDevMode = () => {
  const set = useSetAtom(setDevModeItemAtom)
  return { set }
}
