import { ComponentProps, FC } from 'react'
import * as Icons from 'lucide-react'
import { ellipsify } from '@/shared/utils'
import { Button } from './button'

type WalletButtonProps = Pick<
  ComponentProps<typeof Button>,
  'loading' | 'disabled' | 'href' | 'onClick'
> & {
  address?: string
}

export const WalletButton: FC<WalletButtonProps> = ({
  address,
  loading,
  disabled,
  href,
  onClick,
}) => (
  <Button
    variant="primary"
    loading={loading}
    disabled={disabled}
    icon={Icons.Wallet}
    href={href}
    onClick={onClick}
  >
    {address ? ellipsify(address) : 'Connect wallet'}
  </Button>
)
