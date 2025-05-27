'use client'

import { useState } from 'react'
import { Account, getMint, Mint, TOKEN_2022_PROGRAM_ID, unpackAccount } from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { AES_SEED_MESSAGE } from './aes-seed-message'
import { generateSeedSignature } from './generate-seed-signature'

export const useDecryptConfidentialBalance = () => {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confidentialBalance, setConfidentialBalance] = useState<string | null>(null)

  const decryptBalance = async (tokenAccountPubkey: PublicKey) => {
    if (!wallet.signMessage || !wallet.publicKey) {
      setError('Wallet connection required')
      return null
    }

    setError(null)
    setIsDecrypting(true)

    try {
      // Sign the AES message
      const aesSignature = await generateSeedSignature(wallet, AES_SEED_MESSAGE)
      const aesSignatureBase64 = Buffer.from(aesSignature).toString('base64')
      console.log('AES base64 signature:', aesSignatureBase64)

      // Get the token account data
      const accountInfo = await connection.getAccountInfo(tokenAccountPubkey)
      if (!accountInfo) {
        throw new Error('Token account not found')
      }

      // Call the decrypt-cb endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/decrypt-cb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aes_signature: aesSignatureBase64,
          token_account_data: Buffer.from(accountInfo.data).toString('base64'),
        }),
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${await response.text()}`)
      }

      const tokenAccountData: Account = unpackAccount(
        tokenAccountPubkey,
        accountInfo,
        TOKEN_2022_PROGRAM_ID
      )
      const mintAccountData: Mint = await getMint(
        connection,
        tokenAccountData.mint,
        'confirmed',
        TOKEN_2022_PROGRAM_ID
      )

      const data = await response.json()

      // Convert lamports to UI amount using mint decimals
      // HACK: Use uiAmount from spl-token instead.
      const rawAmount = data.amount
      const decimals = mintAccountData.decimals
      const decryptedBalance = (parseInt(rawAmount) / Math.pow(10, decimals)).toString()

      setConfidentialBalance(decryptedBalance)
      return decryptedBalance
    } catch (error) {
      console.error('Decryption failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to decrypt balance')
      return null
    } finally {
      setIsDecrypting(false)
    }
  }

  return {
    decryptBalance,
    isDecrypting,
    confidentialBalance,
    error,
    reset: () => {
      setConfidentialBalance(null)
      setError(null)
    },
  }
}
