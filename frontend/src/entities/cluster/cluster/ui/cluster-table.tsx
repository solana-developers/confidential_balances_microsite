import { ComponentProps, FC, useMemo } from 'react'
import { Badge } from '@solana-foundation/ms-tools-ui/components/badge'
import { Button } from '@solana-foundation/ms-tools-ui/components/button'
import { IconTrash } from '@tabler/icons-react'
import { Plus } from 'lucide-react'
import { useCluster } from '@/shared/solana'
import { DataTable } from '@/shared/ui/data-table'

type DataTableAction = NonNullable<ComponentProps<typeof DataTable>['actions']>[0]

type ClusterTableProps = {
  onAddCluster: () => void
}

export const ClusterTable: FC<ClusterTableProps> = ({ onAddCluster }) => {
  const { clusters, setCluster, deleteCluster } = useCluster()

  const actions = useMemo<DataTableAction[]>(() => {
    const list = [
      {
        action: 'add',
        title: 'Add cluster',
        icon: <Plus />,
        onClick: onAddCluster,
      },
    ]
    return list
  }, [onAddCluster])

  return (
    <div className="overflow-x-auto">
      <DataTable
        title="Cluster Selector"
        labels={{
          empty: 'No clusters',
        }}
        headers={['Name', 'Network', 'Status', 'Actions']}
        actions={actions}
        rows={clusters.map((item) => {
          return [
            <span key={`clustername-${item.name}`} className="text-xl">
              {item?.active ? (
                item.name
              ) : (
                <button
                  title="Select cluster"
                  className="cursor-pointer"
                  onClick={() => setCluster(item)}
                >
                  {item.name}
                </button>
              )}
            </span>,
            <>
              <span className="text-xs">Network: {item.network ?? 'custom'}</span>
              <div className="text-xs whitespace-nowrap text-gray-500">{item.endpoint}</div>
            </>,
            item?.active ? (
              <Badge size="xxs" variant="success">
                Active
              </Badge>
            ) : (
              <></>
            ),
            <Button
              key={`clusteractions-${item.name}`}
              disabled={item?.active}
              variant="ghost"
              onClick={() => {
                if (!window.confirm('Are you sure?')) return
                deleteCluster(item)
              }}
            >
              <IconTrash size={16} />
            </Button>,
          ]
        })}
      />
    </div>
  )
}
