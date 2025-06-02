import { FC, PropsWithChildren, useCallback, useEffect, useRef } from 'react'
import { cn } from '@/shared/utils'

type StickyPanelProps = PropsWithChildren<{
  className?: string
}>

export const StickyPanel: FC<StickyPanelProps> = ({ children, className }) => {
  const ref = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(
    () =>
      window.requestAnimationFrame(() => {
        const height = window.innerHeight - (ref.current?.getBoundingClientRect().top ?? 0)
        if (ref.current) {
          ref.current.style.height = `${height}px`
        }
      }),
    [ref]
  )

  useEffect(() => {
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [handleScroll])

  return (
    <div ref={ref} className={cn('sticky top-0 h-full', className)}>
      {children}
    </div>
  )
}
