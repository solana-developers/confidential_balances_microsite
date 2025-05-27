'use client'

import { FC, useState } from 'react'
import { Connection } from '@solana/web3.js'
import { ClusterNetwork, useCluster } from '@/shared/solana'
import { Modal } from '@/shared/ui/modal'

type ClusterModalProps = {
  hideModal: () => void
  show: boolean
}

export const ClusterModal: FC<ClusterModalProps> = ({ hideModal, show }) => {
  const { addCluster } = useCluster()
  const [name, setName] = useState<string>('')
  const [network, setNetwork] = useState<ClusterNetwork | undefined>()
  const [endpoint, setEndpoint] = useState('')

  return (
    <Modal
      title={'Add Cluster'}
      hide={hideModal}
      show={show}
      submit={() => {
        try {
          new Connection(endpoint)
          if (name) {
            addCluster({ name, network, endpoint })
            hideModal()
          } else {
            console.log('Invalid cluster name')
          }
        } catch {
          console.log('Invalid cluster endpoint')
        }
      }}
      submitLabel="Save"
    >
      <input
        type="text"
        placeholder="Name"
        className="input input-bordered w-full"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Endpoint"
        className="input input-bordered w-full"
        value={endpoint}
        onChange={(e) => setEndpoint(e.target.value)}
      />
      <select
        className="select select-bordered w-full"
        value={network}
        onChange={(e) => setNetwork(e.target.value as ClusterNetwork)}
      >
        <option value={undefined}>Select a network</option>
        <option value={ClusterNetwork.Devnet}>Devnet</option>
        <option value={ClusterNetwork.Testnet}>Testnet</option>
        <option value={ClusterNetwork.Mainnet}>Mainnet</option>
      </select>
    </Modal>
  )
}
