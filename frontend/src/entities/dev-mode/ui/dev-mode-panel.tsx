import { FC, MutableRefObject } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { Description, Step } from '@/shared/ui/dev-mode'
import { LogItem, LogItemResult } from '@/shared/ui/log'
import { Panel } from '@/shared/ui/panel'
import { DevModeItem, devModeItemsAtom, Step as StepNumber } from '../model/dev-mode-items'
import { devModeOpenAtom } from '../model/dev-mode-open'
import { useScrollToStep } from '../utils/use-scroll-to-step'

export const DevModePanel: FC = () => {
  const setDevModeOpen = useSetAtom(devModeOpenAtom)
  const steps = useAtomValue(devModeItemsAtom)

  const step1Ref = useScrollToStep(steps.get(1)?.result)
  const step2Ref = useScrollToStep(steps.get(2)?.result)
  const step3Ref = useScrollToStep(steps.get(3)?.result)
  const step4Ref = useScrollToStep(steps.get(4)?.result)
  const step5Ref = useScrollToStep(steps.get(5)?.result)
  const step6Ref = useScrollToStep(steps.get(6)?.result)
  const step7Ref = useScrollToStep(steps.get(7)?.result)

  return (
    <Panel
      title="Dev Mode"
      className="-mx-5 max-h-full border-t-0 border-r-0 border-b-0 border-l-0 md:mx-0 md:border-r md:border-l"
      onClose={() => setDevModeOpen(false)}
    >
      <Description />

      <Item
        step={1}
        title="Start with a token mint"
        description="Begin with a token mint that supports confidential transfers. You'll need the mint address to proceed."
        command="spl-token create-token --program-2022 --enable-confidential-transfers auto"
        item={steps.get(1)}
        ref={step1Ref}
      />

      <Item
        step={2}
        title="Create a Confidential ATA"
        description='Click the "Create & Initialize Confidential Balance ATA\" button to initialize a new token account that supports confidential balances.'
        command="spl-token create-account --program-2022 $MINT_PUBKEY && spl-token configure-confidential-transfer-account $MINT_PUBKEY"
        item={steps.get(2)}
        ref={step2Ref}
      />

      <Item
        step={3}
        title="Receive tokens"
        description='Receive tokens to your newly created Associated Token Account (ATA). These will appear as your "Public Balance".'
        command="spl-token --program-2022 mint $MINT_PUBKEY $MINT_AMOUNT"
        item={steps.get(3)}
        ref={step3Ref}
      />

      <Item
        step={4}
        title="Deposit to confidential balance"
        description='Click the "Deposit" button and specify how many tokens you want to move from public to confidential balance.'
        command="spl-token deposit-confidential-tokens $MINT_PUBKEY $DEPOSIT_AMOUNT"
        item={steps.get(4)}
        ref={step4Ref}
      />

      <Item
        step={5}
        title="Apply pending balances"
        description='Click the "Apply" button to confirm and finalize the deposit operation, moving your tokens from pending to available confidential balance.'
        command="spl-token apply-pending-balance $MINT_PUBKEY"
        item={steps.get(5)}
        ref={step5Ref}
      />

      <Item
        step={6}
        title="Decrypt your balance"
        description='Use the "Decrypt Available Balance" button to view your confidential balance. This decrypts the balance locally for your viewing only.'
        command="spl-token --program-2022 balance $MINT_PUBKEY"
        item={steps.get(6)}
        ref={step6Ref}
      />

      <Item
        step={7}
        title="Send confidential tokens"
        description="To transfer tokens confidentially, enter the recipient's address (which must also have a confidential ATA) and the amount to send from your available confidential balance."
        command="spl-token --program-2022 transfer $MINT_PUBKEY 1 $RECIPIENT_WALLET --confidential"
        item={steps.get(7)}
        ref={step7Ref}
      />

      <p className="px-6 pt-4 pb-16 text-xs tracking-[-0.0375rem] text-[var(--foreground)]/50">
        Remember that all confidential operations require blockchain transactions. You may need to
        approve these in your wallet.
      </p>
    </Panel>
  )
}

const Item: FC<{
  step: StepNumber
  title: string
  description: string
  command?: string
  item?: DevModeItem
  ref?: MutableRefObject<HTMLDivElement | null>
}> = ({ step, title, description, command, item, ref }) => (
  <Step
    step={step}
    title={title}
    description={description}
    command={command}
    done={!!item}
    ref={ref}
  >
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
