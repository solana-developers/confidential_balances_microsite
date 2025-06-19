import { FC } from 'react'
import { NATIVE_MINT } from '@solana/spl-token'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletAccountHeader } from '@/entities/account-header'
import { TokenAccounts } from '@/features/token-account'
import { CardStep } from '@/shared/ui/card-step'
import { Text } from '@/shared/ui/text'

export const Dashboard: FC = () => {
  const { publicKey } = useWallet()

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Text variant="header1">Confidential balances demo</Text>
        <Text>
          Transfer tokens confidentially on Solana. An end-to-end demonstration of encrypted token
          transfers using Solana&apos;s Confidential Transfer extension
        </Text>
      </div>
      <div className="@container/cards">
        <div className="grid grid-cols-1 gap-x-4 gap-y-2 @3xl/cards:grid-cols-12">
          <CardStep
            step={1}
            title="Create test token"
            description="Spin up a demo token on Devnet with Confidential Transfers already enabled"
            className="col-span-3"
          />
          <CardStep
            step={2}
            title="Create confidential account"
            description="Set up a confidential token account and its encryption keys"
            className="col-span-3"
          />
          <CardStep
            step={3}
            title="Mint tokens"
            description="Receive free tokens in your account for testing purposes"
            className="col-span-3"
          />
          <CardStep
            step={4}
            title="Start playing with token accounts"
            description="Deposit, transfer, or withdraw in privacy mode"
            className="col-span-3"
          />
        </div>
      </div>
      <div>
        <Text variant="textSmall">
          Your encryption keys (ElGamal & AES) are generated securely from your wallet signature and
          used only during your session. They are never stored, logged, or shared — and are
          discarded immediately after use.
        </Text>
      </div>
      <WalletAccountHeader
        wallet={publicKey?.toString()}
        mint={NATIVE_MINT}
        className="mt-12 flex h-[62px]"
      />
      <TokenAccounts />
    </section>
  )
}
