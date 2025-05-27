import { FC } from 'react'
import { IconTrash } from '@tabler/icons-react'
import { useCluster } from '@/shared/solana'

export const ClusterTable: FC = () => {
  const { clusters, setCluster, deleteCluster } = useCluster()

  return (
    <div className="overflow-x-auto">
      <table className="border-base-300 table border-separate border-4">
        <thead>
          <tr>
            <th>Name/ Network / Endpoint</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {clusters.map((item) => (
            <tr key={item.name} className={item?.active ? 'bg-base-200' : ''}>
              <td className="space-y-2">
                <div className="space-x-2 whitespace-nowrap">
                  <span className="text-xl">
                    {item?.active ? (
                      item.name
                    ) : (
                      <button
                        title="Select cluster"
                        className="link link-secondary"
                        onClick={() => setCluster(item)}
                      >
                        {item.name}
                      </button>
                    )}
                  </span>
                </div>
                <span className="text-xs">Network: {item.network ?? 'custom'}</span>
                <div className="text-xs whitespace-nowrap text-gray-500">{item.endpoint}</div>
              </td>
              <td className="space-x-2 text-center whitespace-nowrap">
                <button
                  disabled={item?.active}
                  className="btn btn-xs btn-default btn-outline"
                  onClick={() => {
                    if (!window.confirm('Are you sure?')) return
                    deleteCluster(item)
                  }}
                >
                  <IconTrash size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
