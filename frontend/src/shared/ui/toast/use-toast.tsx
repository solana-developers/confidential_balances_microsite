import { useMemo } from 'react'
import copy from 'copy-to-clipboard'
import { toast } from 'sonner'
import { ExplorerLink } from '@/entities/cluster/cluster/ui/explorer-link'
import { ToastLayout } from './toast-layout'

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
        address: (message: string, address: string) => {
          toast.info(
            <ToastLayout
              button={
                <button
                  className="shrink-0 cursor-pointer text-xs"
                  aria-label="Copy Address"
                  onClick={() => {
                    copy(address)
                    toast.success('Copied to clipboard')
                  }}
                >
                  Copy Address
                </button>
              }
            >
              {message}
            </ToastLayout>,
            {
              classNames: {
                content: 'flex-1',
              },
            }
          )
        },
        transaction: (signature: string) => {
          toast.info(
            <ToastLayout
              button={
                <ExplorerLink
                  path={`/tx/${signature}`}
                  className="shrink-0 text-xs"
                  label="View Transaction"
                />
              }
            >
              Transaction sent
            </ToastLayout>,
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
