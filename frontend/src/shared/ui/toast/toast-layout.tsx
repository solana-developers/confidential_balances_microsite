import { FC, ReactNode, type PropsWithChildren } from 'react'

type ToastLayoutProps = PropsWithChildren<{
  button?: ReactNode
}>

export const ToastLayout: FC<ToastLayoutProps> = ({ children, button }) => (
  <div className="flex w-full flex-nowrap items-center gap-2">
    <p className="flex-1">{children}</p>
    {button}
  </div>
)
