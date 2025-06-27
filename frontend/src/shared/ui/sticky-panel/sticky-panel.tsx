import { FC, PropsWithChildren, RefObject, useCallback, useEffect, useRef } from 'react'
import { cn } from '@/shared/utils'

type StickyPanelProps = PropsWithChildren<{
  className?: string
  containerRef?: RefObject<HTMLElement | null>
}>

export const StickyPanel: FC<StickyPanelProps> = ({ children, className, containerRef }) => {
  const ref = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(
    () =>
      window.requestAnimationFrame(() => {
        if (ref.current) {
          const height =
            (containerRef?.current?.offsetHeight ?? window.innerHeight) -
            (ref.current?.getBoundingClientRect().top ?? 0)

          ref.current.style.height = `${height}px`
        }
      }),
    [ref, containerRef]
  )

  useEffect(() => {
    const container = containerRef?.current

    // Trigger initial height calculation
    handleScroll()

    // Listen for scroll events
    window.addEventListener('scroll', handleScroll)
    if (container) container.addEventListener('scroll', handleScroll)

    // Listen for resize events
    window.addEventListener('resize', handleScroll)

    const resizeObserver = new ResizeObserver(handleScroll)
    if (container) resizeObserver.observe(container)

    return () => {
      // Remove scroll event listeners
      window.removeEventListener('scroll', handleScroll)
      if (container) container.removeEventListener('scroll', handleScroll)

      // Remove resize event listeners
      window.removeEventListener('resize', handleScroll)
      if (container) {
        resizeObserver.unobserve(container)
        resizeObserver.disconnect()
      }
    }
  }, [handleScroll, containerRef])

  return (
    <div ref={ref} className={cn('sticky top-0 h-full', className)}>
      {children}
    </div>
  )
}
