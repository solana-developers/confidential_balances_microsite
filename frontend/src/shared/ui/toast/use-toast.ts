import { toast } from 'sonner'

export const useToast = () =>
  ({
    success: toast.success,
    info: toast.info,
    warning: toast.warning,
    error: toast.error,
    custom: toast.custom,
    message: toast.message,
    promise: toast.promise,
    loading: toast.loading,
  }) as const
