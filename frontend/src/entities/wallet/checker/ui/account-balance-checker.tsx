import { ComponentProps, FC, useState, type PropsWithChildren } from 'react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@solana-foundation/ms-tools-ui/components/alert'
import { PublicKey } from '@solana/web3.js'
import { ChevronRight } from 'lucide-react'
import { useGetBalance } from '@/entities/account/account/model/use-get-balance'
import { useCluster } from '@/shared/solana'
import { cn } from '@/shared/utils'
import { ModalRequestAirdrop } from './modal-request-airdrop'

type AccountBalanceCheckerProps = PropsWithChildren<{
  address: PublicKey
}> &
  ComponentProps<'div'>

export const AccountBalanceChecker: FC<AccountBalanceCheckerProps> = ({
  children,
  address,
  className,
}) => {
  const { cluster } = useCluster()
  const query = useGetBalance({ address })

  const [requestAirdropOpen, setRequestAirdropOpen] = useState<boolean>(false)

  if (query.isLoading) return undefined

  if (query.isError || !query.data) {
    return (
      <>
        <Alert
          className={cn('z-50 max-h-22 cursor-pointer [&_svg]:shrink-0', className)}
          variant="warning"
          onClick={() => setRequestAirdropOpen(true)}
        >
          <AlertTitle>
            You are connected to <strong>{cluster.name}</strong> but your account is not found on
            this cluster.
          </AlertTitle>
          <AlertDescription className="flex flex-nowrap items-center gap-2">
            Request airdrop
            <ChevronRight className="size-4" />
          </AlertDescription>
        </Alert>

        <ModalRequestAirdrop
          hide={() => setRequestAirdropOpen(false)}
          show={requestAirdropOpen}
          address={address}
        />
      </>
    )
  }

  return children
}
