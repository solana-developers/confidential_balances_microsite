import { FC } from 'react'

type AppLinkProps = {
  path: string
  label: string
  className?: string
}

export const AppLink: FC<AppLinkProps> = ({ path, label, className }) => (
  <a href={path} className={className ? className : `link font-mono`}>
    {label}
  </a>
)
