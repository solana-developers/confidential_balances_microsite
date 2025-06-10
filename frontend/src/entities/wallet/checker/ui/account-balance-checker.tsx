import { FC, useState, type PropsWithChildren } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@solana-foundation/ms-tools-ui'
import { PublicKey } from '@solana/web3.js'
import * as Icons from 'lucide-react'
import { useCluster } from '@/shared/solana'
import { useGetBalance } from '../model/use-get-balance'
import { ModalRequestAirdrop } from './modal-request-airdrop'

type AccountBalanceCheckerProps = PropsWithChildren<{
  address: PublicKey
}>

export const AccountBalanceChecker: FC<AccountBalanceCheckerProps> = ({ children, address }) => {
  const { cluster } = useCluster()
  const query = useGetBalance({ address })

  const [requestAirdropOpen, setRequestAirdropOpen] = useState<boolean>(false)

  if (query.isLoading) return undefined

  if (query.isError || !query.data) {
    return (
      <>
        <Alert
          className="cursor-pointer"
          variant="warning"
          onClick={() => setRequestAirdropOpen(true)}
        >
          <AlertTitle>
            You are connected to <strong>{cluster.name}</strong> but your account is not found on
            this cluster.
          </AlertTitle>
          <AlertDescription className="flex flex-nowrap items-center gap-2">
            Request airdrop
            <Icons.ChevronRight className="size-4" />
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
