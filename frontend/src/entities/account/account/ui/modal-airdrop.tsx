import { FC, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { Modal } from '@/shared/ui/modal'
import { useRequestAirdrop } from '../model/use-request-airdrop'

type ModalAirdropProps = {
  hide: () => void
  show: boolean
  address: PublicKey
}

export const ModalAirdrop: FC<ModalAirdropProps> = ({ hide, show, address }) => {
  const mutation = useRequestAirdrop({ address })
  const [amount, setAmount] = useState('2')

  return (
    <Modal
      hide={hide}
      show={show}
      title="Airdrop"
      submitDisabled={!amount || mutation.isPending}
      submitLabel="Request Airdrop"
      submit={() => mutation.mutateAsync(parseFloat(amount)).then(() => hide())}
    >
      <input
        disabled={mutation.isPending}
        type="number"
        step="any"
        min="1"
        placeholder="Amount"
        className="input input-bordered w-full"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
    </Modal>
  )
}
