import { FC, type PropsWithChildren } from 'react'

type ContentProps = PropsWithChildren<{
  isLoading?: boolean
  error?: Error | null
  loadingMessage?: string
  errorMessage?: string
}>

export const Content: FC<ContentProps> = ({
  children,
  isLoading,
  error,
  loadingMessage,
  errorMessage,
}) => {
  if (isLoading) {
    return <div className="text-sm text-[var(--foreground)]">{loadingMessage ?? 'Loading...'}</div>
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-sm text-[var(--foreground)]">{errorMessage ?? 'Error loading data'}</h2>
        <p className="text-xs break-all text-[var(--foreground)]/90">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    )
  }

  return children
}
