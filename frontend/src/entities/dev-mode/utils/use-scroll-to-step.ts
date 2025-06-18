import { useEffect, useRef } from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'

export const useScrollToStep = (result: string | undefined) => {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (result && ref.current) {
      scrollIntoView(ref.current, { behavior: 'smooth', scrollMode: 'if-needed' })
    }
  }, [result])

  return ref
}
