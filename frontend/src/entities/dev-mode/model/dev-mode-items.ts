import { atom, useSetAtom } from 'jotai'

export type Step = 1 | 2 | 3 | 4 | 5
export type DevModeItem = {
  title: string
  result: string
  success: boolean
}

export const devModeItemsAtom = atom<Map<Step, DevModeItem>>(new Map())

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
