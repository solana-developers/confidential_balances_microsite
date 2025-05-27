import { FC } from 'react'
import { PublicKey } from '@solana/web3.js'
import { useCluster } from '@/shared/solana/cluster'
import { useGetBalance } from '../model/use-get-balance'
import { useRequestAirdrop } from '../model/use-request-airdrop'

type AccountBalanceCheckProps = {
  address: PublicKey
}

export const AccountBalanceCheck: FC<AccountBalanceCheckProps> = ({ address }) => {
  const { cluster } = useCluster()
  const mutation = useRequestAirdrop({ address })
  const query = useGetBalance({ address })

  if (query.isLoading) {
    return null
  }
  if (query.isError || !query.data) {
    return (
      <div className="alert alert-warning text-warning-content/80 flex justify-center rounded-none">
        <span>
          You are connected to <strong>{cluster.name}</strong> but your account is not found on this
          cluster.
        </span>
        <button
          className="btn btn-xs btn-neutral"
          onClick={() => mutation.mutateAsync(1).catch((err) => console.log(err))}
        >
          Request Airdrop
        </button>
      </div>
    )
  }
  return null
}
