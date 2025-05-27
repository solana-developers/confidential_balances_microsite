'use client'

import { FC, useState } from 'react'
import { ClusterModal, ClusterTable } from '@/entities/cluster/cluster'
import { Hero } from '@/shared/ui/hero'

export const Clusters: FC = () => {
  const [showModal, setShowModal] = useState(false)

  return (
    <div>
      <Hero title="Clusters" subtitle="Manage and select your Solana clusters">
        <ClusterModal show={showModal} hideModal={() => setShowModal(false)} />
        <button className="btn btn-xs lg:btn-md btn-primary" onClick={() => setShowModal(true)}>
          Add Cluster
        </button>
      </Hero>
      <ClusterTable />
    </div>
  )
}
