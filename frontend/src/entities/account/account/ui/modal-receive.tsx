import { FC } from 'react'
import { PublicKey } from '@solana/web3.js'
import { Modal } from '@/shared/ui/modal'

type ModalReceiveProps = {
  hide: () => void
  show: boolean
  address: PublicKey
}

export const ModalReceive: FC<ModalReceiveProps> = ({ hide, show, address }) => (
  <Modal title="Receive" hide={hide} show={show}>
    <p>Receive assets by sending them to your public key:</p>
    <code>{address.toString()}</code>
  </Modal>
)
