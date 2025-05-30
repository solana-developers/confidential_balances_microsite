import { FC } from 'react'
import { useSetAtom } from 'jotai'
import { Description, Step } from '@/shared/ui/dev-mode'
import { LogItem, LogItemResult } from '@/shared/ui/log'
import { Panel } from '@/shared/ui/panel'
import { devModeOpenAtom } from '../model/dev-mode-open'

export const DevModePanel: FC = () => {
  const setDevModeOpen = useSetAtom(devModeOpenAtom)

  return (
    <Panel
      title="Dev Mode"
      className="-mx-5 border-t-0 border-r-0 border-b-0 border-l-0 md:mx-0 md:border-r md:border-l"
      onClose={() => setDevModeOpen(false)}
    >
      <Description />
      <Step
        step={1}
        title="Create new Token with confidential transfers extensions"
        description="Use the spl-token CLI to create a new token that supports confidential transfers. This enables privacy-preserving transactions on Solana by leveraging the 2022 token program and enabling confidential transfer features automatically."
        command="spl-token --program-2022 create-token --enable-confidential-transfers-auto"
        done={true}
      >
        <LogItem title="Deposit Operation - COMPLETE" success={true}>
          <LogItemResult success={true}>{`Txn1 [SUCCESS]`}</LogItemResult>
          <LogItemResult
            success={true}
          >{`  ConfidentialTransferInstruction::Deposit`}</LogItemResult>
          <LogItemResult success={true}>{`    Note: Deposited 12 tokens`}</LogItemResult>
        </LogItem>
      </Step>
      <Step
        step={2}
        title="Create new account"
        description="Use the spl-token CLI to create a new token that supports confidential transfers. This enables privacy-preserving transactions on Solana by leveraging the 2022 token program and enabling confidential transfer features automatically."
        command="spl-token create-account sndjk839njanJKASNd"
        done={true}
      >
        <LogItem title="Deposit Operation - COMPLETE" success={true}>
          <LogItemResult success={true}>{`Txn1 [SUCCESS]`}</LogItemResult>
          <LogItemResult
            success={true}
          >{`  ConfidentialTransferInstruction::Deposit`}</LogItemResult>
          <LogItemResult success={true}>{`    Note: Deposited 12 tokens`}</LogItemResult>
        </LogItem>
      </Step>
      <Step
        step={3}
        title="Mint tokens for new account"
        description="Use the spl-token CLI to create a new token that supports confidential transfers. This enables privacy-preserving transactions."
        command="spl-token mint sndjk839njanJKASNd 1000"
        done={true}
      >
        <LogItem title="Deposit Operation - COMPLETE" success={false}>
          <LogItemResult success={false}>{`Txn1 [SUCCESS]`}</LogItemResult>
          <LogItemResult
            success={true}
          >{`  ConfidentialTransferInstruction::Deposit`}</LogItemResult>
          <LogItemResult success={false}>{`    Note: Deposited 12 tokens`}</LogItemResult>
        </LogItem>
      </Step>
      <Step
        step={4}
        title="Create confidential balance"
        description="Use the spl-token CLI to create a new token that supports confidential transfers. This enables privacy-preserving transactions."
        command="spl-token mint sndjk839njanJKASNd 1000"
        done={false}
      ></Step>
      <Step
        step={5}
        title="Deposit tokens to confidential balance"
        description="Use the spl-token CLI to create a new token that supports confidential transfers. This enables privacy-preserving transactions."
        command="spl-token mint sndjk839njanJKASNd 1000"
        done={false}
      ></Step>
    </Panel>
  )
}
