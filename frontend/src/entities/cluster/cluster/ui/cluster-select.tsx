import { FC } from 'react'
import { Combobox, ComboboxButton, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import { Badge, Button } from '@solana-foundation/ms-tools-ui'
import { NetworkIcon } from 'lucide-react'
import { useCluster } from '@/shared/solana'

export const ClusterSelect: FC = () => {
  const { clusters, setCluster, cluster } = useCluster()

  return (
    <div className="relative">
      <Combobox value={cluster} onChange={setCluster}>
        <ComboboxButton as="div">
          <Button variant="secondary" className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2 capitalize">
              <NetworkIcon className="h-4 w-4" />
              <span>{cluster.name}</span>
            </div>
            {/* <ChevronDown className="h-4 w-4" /> */}
          </Button>
        </ComboboxButton>

        <ComboboxOptions className="ring-opacity-5 absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#2c2d30] py-1 text-base shadow-lg ring-1 ring-black focus:outline-none">
          {clusters.map((item) => (
            <ComboboxOption
              key={item.name}
              value={item}
              className={({ focus, selected }) =>
                `relative cursor-pointer px-4 py-2 select-none ${
                  focus ? 'bg-accent text-accent-foreground' : 'text-base-content'
                } ${selected ? 'font-semibold' : ''}`
              }
            >
              {({ selected }) => (
                <div className="flex items-center justify-between capitalize">
                  <span className="text-xs">{item.name}</span>
                  {selected && (
                    <Badge variant="success" size="xxs" className="ml-2">
                      Active
                    </Badge>
                  )}
                </div>
              )}
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </Combobox>
    </div>
  )
}
