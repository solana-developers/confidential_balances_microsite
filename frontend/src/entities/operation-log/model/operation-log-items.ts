import { atom, useAtomValue, useSetAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export type OperationLogItem = {
  title: string
  content: string
  variant: 'success' | 'error' | 'muted'
}

const OPERATION_LOG_STORAGE_KEY = 'operation-log'
export const MAX_LOG_ITEMS = 200

export const operationLogAtom = atomWithStorage<OperationLogItem[]>(OPERATION_LOG_STORAGE_KEY, [])

const pushOperationLogAtom = atom(null, (get, set, item: OperationLogItem) => {
  const prev = get(operationLogAtom)
  const next = [...prev, item]
  set(
    operationLogAtom,
    next.length > MAX_LOG_ITEMS ? next.slice(next.length - MAX_LOG_ITEMS) : next
  )
})

export const useOperationLog = () => {
  const push = useSetAtom(pushOperationLogAtom)
  return { push }
}
