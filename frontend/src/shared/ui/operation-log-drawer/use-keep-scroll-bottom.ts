import { useEffect } from 'react'

export const useKeepScrollBottom = (enabled: boolean, container: HTMLElement | null) => {
  useEffect(() => {
    if (!container || !enabled) return

    container.scrollTop = container.scrollHeight
    const observer = new MutationObserver(() => {
      container.scrollTop = container.scrollHeight
    })

    observer.observe(container, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [container, enabled])
}
