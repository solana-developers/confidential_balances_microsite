/* eslint-disable react/no-unescaped-entities */
'use client'

import { AppHero } from '../ui/ui-layout'

const links: { label: string; href: string }[] = [
  { 
    label: 'GitHub Repository', 
    href: 'https://github.com/solana-developers/confidential_balances_microsite' 
  },
  { 
    label: 'Product Guide', 
    href: 'https://github.com/solana-developers/Confidential-Balances-Sample/blob/main/docs/product_guide.md' 
  },
  { 
    label: 'Solana Docs', 
    href: 'https://docs.solana.com/' 
  },
  { 
    label: 'Solana Faucet', 
    href: 'https://faucet.solana.com/' 
  },
]

export default function DashboardFeature() {
  return (
    <div>
      <AppHero 
        title="Confidential Balances Demo" 
        subtitle="A graphical interface for conducting confidential token transfers on Solana." 
      />
      <div className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">About This Demo</h2>
            <p className="mb-4">
              This microsite provides a user-friendly interface for conducting confidential token transfers on Solana using browser wallets. 
              It serves as an alternative to the <a href="https://spl.solana.com/confidential-token/quickstart" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">SPL Token CLI</a>, making it easier to interact with confidential balances through a graphical interface.
            </p>
            <p className="">
              Built on top of Solana&apos;s Token-2022 program, this demo showcases the power of confidential transfers while maintaining compliance capabilities.
            </p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">How to Use</h2>
            <div className="border-4 rounded-lg border-separate border-base-300 bg-gray-900 p-6">
              <div className="mx-auto max-w-lg">
                <ol className="list-decimal space-y-4 text-left">
                  <li className="py-2">
                    <span className="font-medium">Start with a token mint</span>
                    <p className="text-gray-600 mt-1">Begin with a token mint that supports confidential transfers. You&apos;ll need the mint address to proceed.</p>
                    <p className="text-gray-600 mt-1">Follow the instructions in the <a href="https://www.solana-program.com/docs/confidential-balances#example-create-a-mint-with-confidential-transfers" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Solana Program documentation</a> to create a token mint with confidential transfers enabled.</p>
                  </li>
                  
                  <li className="py-2">
                    <span className="font-medium">Create a Confidential ATA</span>
                    <p className="text-gray-600 mt-1">Click the &quot;Create &amp; Initialize Confidential Balance ATA&quot; button to initialize a new token account that supports confidential balances.</p>
                  </li>
                  
                  <li className="py-2">
                    <span className="font-medium">Receive tokens</span>
                    <p className="text-gray-600 mt-1">Receive tokens to your newly created Associated Token Account (ATA). These will appear as your &quot;Public Balance&quot;.</p>
                  </li>
                  
                  <li className="py-2">
                    <span className="font-medium">Deposit to confidential balance</span>
                    <p className="text-gray-600 mt-1">Click the &quot;Deposit&quot; button and specify how many tokens you want to move from public to confidential balance.</p>
                  </li>
                  
                  <li className="py-2">
                    <span className="font-medium">Apply pending balances</span>
                    <p className="text-gray-600 mt-1">Click the &quot;Apply&quot; button to confirm and finalize the deposit operation, moving your tokens from pending to available confidential balance.</p>
                  </li>
                  
                  <li className="py-2">
                    <span className="font-medium">Decrypt your balance</span>
                    <p className="text-gray-600 mt-1">Use the &quot;Decrypt Available Balance&quot; button to view your confidential balance. This decrypts the balance locally for your viewing only.</p>
                  </li>
                  
                  <li className="py-2">
                    <span className="font-medium">Send confidential tokens</span>
                    <p className="text-gray-600 mt-1">To transfer tokens confidentially, enter the recipient&apos;s address (which must also have a confidential ATA) and the amount to send from your available confidential balance.</p>
                  </li>
                </ol>
                <p className="text-sm text-gray-500 mt-6">
                  Remember that all confidential operations require blockchain transactions. You may need to approve these in your wallet.
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Features</h2>
            <div className="border-4 rounded-lg border-separate border-base-300 bg-gray-900 p-6">
              <div className="mx-auto max-w-lg">
                <ul className="space-y-4 text-left">
                  <li className="py-2">
                    <span className="font-medium">Cluster selection</span>
                    <p className="text-gray-600 mt-1">
                      Choose your intended Solana cluster. Be sure to assign the same cluster on your wallet as well. For mainnet, you will need to provide your own RPC endpoint since mainnet public endpoint (<a href="https://api.mainnet-beta.solana.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 underline">api.mainnet-beta.solana.com</a>) is restricted. The current version of this site was tested for mainnet with <a href="https://www.helius.dev/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 underline">Helius</a> free tier.
                    </p>
                  </li>
                  
                  <li className="py-2">
                    <span className="font-medium">Auditor tab <span className="ml-2 text-xs bg-blue-800 text-blue-200 px-2 py-1 rounded-full">coming soon</span></span>
                    <p className="text-gray-600 mt-1">
                      Allow individuals with access to the Confidential Transfer auditor key to decrypt the balances of a given transaction hash.
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Cautions</h2>
            <div className="border-2 rounded-lg border-yellow-500/30 bg-yellow-500/5 p-6">
              <div className="mx-auto max-w-lg">
                <ul className="space-y-4 text-left">
                  <li className="py-2">
                    <span className="font-medium text-gray-200">Failed operations</span>
                    <p className="text-gray-400 mt-1">
                      This demo requires optimizations. It currently makes excessive RPC calls to evaluate account states. Hitting API limits (especially on public endpoints like devnet &amp; testnet) may result in failed transactions. Confidential Balances operations are often comprised of several transactions. Failing operations half-way may lead to states only recoverable via CLI or other custom implementations. Be sure to have adequate RPC rate limits until optimizations land.
                    </p>
                  </li>
                  
                  <li className="py-2">
                    <span className="font-medium text-gray-200">Only operate this demo from trusted URLs</span>
                    <p className="text-gray-400 mt-1">
                      Most of this demo&apos;s business logic is orchestrated on a <a href="https://github.com/solana-developers/confidential_balances_microsite/tree/main/backend" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 underline">backend</a> facilitating encryption on behalf of the user and therefore exposing the keys during runtime. While your funds are always safe if leaking encryption keys, it defeats the entire purpose of confidentiality. When in doubt, host the project yourself!
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Helpful Resources</h2>
            <div className="space-y-2">
              {links.map((link, index) => (
                <div key={index}>
                  <a 
                    href={link.href} 
                    className="text-blue-500 hover:text-blue-400 underline" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {link.label}
                  </a>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col items-center mt-10 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-medium mb-3">Help Us Improve!</h3>
            <p className="text-gray-400 text-center mb-4 max-w-lg">
              Found something confusing? Have an idea to make this better? We welcome all feedback - technical or not!
            </p>
            <a 
              href="https://github.com/solana-developers/confidential_balances_microsite/issues" 
              className="flex items-center px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              target="_blank" 
              rel="noopener noreferrer"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Share Feedback or Report Issues
            </a>
            <p className="text-xs text-gray-500 mt-3">
              No GitHub account? That&apos;s okay! Anyone can view existing issues.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
