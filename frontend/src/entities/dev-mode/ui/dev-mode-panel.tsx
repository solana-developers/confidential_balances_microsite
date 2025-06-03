import { FC } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { Description, Step } from '@/shared/ui/dev-mode'
import { LogItem, LogItemResult } from '@/shared/ui/log'
import { Panel } from '@/shared/ui/panel'
import { DevModeItem, devModeItemsAtom, Step as StepNumber } from '../model/dev-mode-items'
import { devModeOpenAtom } from '../model/dev-mode-open'

export const DevModePanel: FC = () => {
  const setDevModeOpen = useSetAtom(devModeOpenAtom)
  const steps = useAtomValue(devModeItemsAtom)

  return (
    <Panel
      title="Dev Mode"
      className="-mx-5 max-h-full border-t-0 border-r-0 border-b-0 border-l-0 md:mx-0 md:border-r md:border-l"
      onClose={() => setDevModeOpen(false)}
    >
      <Description />

      <Item
        step={1}
        title="Create new Token with confidential transfers extensions"
        description="Use the spl-token CLI to create a new token that supports confidential transfers. This enables privacy-preserving transactions on Solana by leveraging the 2022 token program and enabling confidential transfer features automatically."
        command="spl-token --program-2022 create-token --enable-confidential-transfers-auto"
        item={steps.get(1)}
      />

      <Item
        step={2}
        title="Create new account"
        description="Use the spl-token CLI to create a new token that supports confidential transfers. This enables privacy-preserving transactions on Solana by leveraging the 2022 token program and enabling confidential transfer features automatically."
        command="spl-token create-account sndjk839njanJKASNd"
        item={steps.get(2)}
      />

      <Item
        step={3}
        title="Mint tokens for new account"
        description="Use the spl-token CLI to create a new token that supports confidential transfers. This enables privacy-preserving transactions."
        command="spl-token mint sndjk839njanJKASNd 1000"
        item={steps.get(3)}
      />

      <Item
        step={4}
        title="Create confidential balance"
        description="Use the spl-token CLI to create a new token that supports confidential transfers. This enables privacy-preserving transactions."
        command="spl-token mint sndjk839njanJKASNd 1000"
        item={steps.get(4)}
      />

      <Item
        step={5}
        title="Deposit tokens to confidential balance"
        description="Use the spl-token CLI to create a new token that supports confidential transfers. This enables privacy-preserving transactions."
        command="spl-token mint sndjk839njanJKASNd 1000"
        item={steps.get(5)}
      />
    </Panel>
  )
}

const Item: FC<{
  step: StepNumber
  title: string
  description: string
  command: string
  item?: DevModeItem
}> = ({ step, title, description, command, item }) => (
  <Step step={step} title={title} description={description} command={command} done={!!item}>
    {item && (
      <LogItem title={item.title} variant={item.success ? 'success' : 'error'}>
        {item.result.split('\n').map((line, index) => (
          <LogItemResult key={index} variant={item.success ? 'success' : 'error'}>
            {line}
          </LogItemResult>
        ))}
      </LogItem>
    )}
  </Step>
)
