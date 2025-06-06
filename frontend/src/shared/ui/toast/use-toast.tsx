import { useMemo } from 'react'
import { toast } from 'sonner'
import { ExplorerLink } from '@/entities/cluster/cluster/ui/explorer-link'

export const useToast = () =>
  useMemo(
    () =>
      ({
        success: toast.success,
        info: toast.info,
        warning: toast.warning,
        error: toast.error,
        custom: toast.custom,
        message: toast.message,
        promise: toast.promise,
        loading: toast.loading,
        transaction: (signature: string) => {
          toast.info(
            <div className="flex w-full flex-nowrap items-center gap-2">
              <p className="flex-1">Transaction sent</p>
              <ExplorerLink
                path={`/tx/${signature}`}
                className="shrink-0 text-xs"
                label="View Transaction"
              />
            </div>,
            {
              classNames: {
                content: 'flex-1',
              },
            }
          )
        },
      }) as const,
    []
  )
