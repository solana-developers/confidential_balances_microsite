'use client'

import { useState } from 'react'
import { Account, getMint, Mint, TOKEN_2022_PROGRAM_ID, unpackAccount } from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useDevMode } from '@/entities/dev-mode'
import { useOperationLog } from '@/entities/operation-log'
import { serverRequest } from '@/shared/api'
import { calculateUiAmount } from '@/shared/solana'
import { AES_SEED_MESSAGE } from './aes-seed-message'
import { generateSeedSignature } from './generate-seed-signature'

export const useDecryptConfidentialBalance = () => {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confidentialBalance, setConfidentialBalance] = useState<string | null>(null)

  const log = useOperationLog()
  const devMode = useDevMode()

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
      const requestBody = {
        aes_signature: aesSignatureBase64,
        token_account_data: Buffer.from(accountInfo.data).toString('base64'),
      }

      const data = await serverRequest<{
        aes_signature: string
        token_account_data: string
      }>('/decrypt-cb', requestBody)

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

      // Convert lamports to UI amount using mint decimals
      const decryptedBalance = calculateUiAmount(data.amount, mintAccountData.decimals)

      setConfidentialBalance(decryptedBalance)

      log.push({
        title: 'Decrypt Operation - COMPLETE',
        content: `Decrypted balance successfully\n  Balance: ${decryptedBalance}`,
        variant: 'success',
      })

      devMode.set(6, {
        title: 'Decrypt Operation - COMPLETE',
        result: `Decrypted balance successfully\n  Balance: ${decryptedBalance}`,
        success: true,
      })

      return decryptedBalance
    } catch (error) {
      console.error('Decryption failed:', error)
      log.push({
        title: 'Decrypt Operation - FAILED',
        content: `Failed to decrypt balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'error',
      })

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
