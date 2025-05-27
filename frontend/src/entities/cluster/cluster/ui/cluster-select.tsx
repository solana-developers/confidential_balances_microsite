import { FC } from 'react'
import { useCluster } from '@/shared/solana'

export const ClusterSelect: FC = () => {
  const { clusters, setCluster, cluster } = useCluster()

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn btn-primary rounded-btn">
        {cluster.name}
      </label>
      <ul
        tabIndex={0}
        className="menu dropdown-content bg-base-100 rounded-box z-[1] mt-4 w-52 p-2 shadow"
      >
        {clusters.map((item) => (
          <li key={item.name}>
            <button
              className={`btn btn-sm ${item.active ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setCluster(item)}
            >
              {item.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
