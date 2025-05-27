import { FC } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useConfidentialVisibility } from '../model/use-confidential-visibility'
import { useDecryptConfidentialBalance } from '../model/use-decrypt-confidential-balance'

type TokenConfidentialBalanceDisplayProps = {
  tokenAccountPubkey: PublicKey
}

export const TokenConfidentialBalanceDisplay: FC<TokenConfidentialBalanceDisplayProps> = ({
  tokenAccountPubkey,
}) => {
  const { isVisible, showBalance, hideBalance } = useConfidentialVisibility(tokenAccountPubkey)
  const { decryptBalance, isDecrypting, confidentialBalance, error } =
    useDecryptConfidentialBalance()
  const wallet = useWallet()

  const handleDecryptBalance = async () => {
    const result = await decryptBalance(tokenAccountPubkey)
    if (result) {
      showBalance()
    }
  }

  return (
    <div className="w-full rounded-lg bg-gray-900 p-6">
      <div className="flex flex-col">
        <div className="pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-gray-400">Confidential Balance</h3>
            {isVisible && (
              <button className="text-blue-500 hover:text-blue-400" onClick={hideBalance}>
                Hide
              </button>
            )}
          </div>

          {!isVisible ? (
            <div className="mt-4">
              {isDecrypting ? (
                <div className="flex items-center space-x-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                  <span className="text-gray-400">Decrypting balance...</span>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleDecryptBalance}
                    className="flex items-center rounded-md border border-gray-700 bg-gray-800 px-5 py-2 text-gray-200 hover:bg-gray-700"
                    disabled={!wallet.connected}
                  >
                    <svg
                      className="mr-2 h-5 w-5"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Decrypt Available Balance
                  </button>
                  {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                  {!wallet.connected && (
                    <p className="mt-2 text-sm text-yellow-500">Connect wallet to decrypt</p>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="mt-2">
              <div className="flex items-center">
                <div className="text-5xl font-bold text-blue-500">{confidentialBalance} Tokens</div>
                <svg
                  className="ml-3 h-6 w-6 text-blue-500"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                This balance is encrypted and only visible to you
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
