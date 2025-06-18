'use client'

import { useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { VersionedTransaction } from '@solana/web3.js'
import bs58 from 'bs58'
import { ELGAMAL_SEED_MESSAGE, generateSeedSignature } from '@/entities/account/account'
import { useOperationLog } from '@/entities/operation-log'
import { useToast } from '@/shared/ui/toast'

export const useDecryptAuditableTx = () => {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [isAuditing, setIsAuditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [auditResult, setAuditResult] = useState<any | null>(null)

  const log = useOperationLog()
  const toast = useToast()

  const auditTransaction = async (transactionSignature: string) => {
    if (!wallet.signMessage || !wallet.publicKey) {
      setError('Wallet connection required')
      return null
    }

    setError(null)
    setIsAuditing(true)

    try {
      // Sign the ElGamal message
      const elGamalSignature = await generateSeedSignature(wallet, ELGAMAL_SEED_MESSAGE)
      const elGamalSignatureBase64 = Buffer.from(elGamalSignature).toString('base64')
      console.log('ElGamal base64 signature:', elGamalSignatureBase64)

      const transactionData = await connection.getTransaction(transactionSignature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      })

      if (!transactionData) {
        throw new Error('Can not fetch transaction')
      }

      // Convert base58 signatures to Uint8Arrays
      const signatures = transactionData.transaction.signatures.map(
        (sig) => new Uint8Array(bs58.decode(sig))
      )

      // Create a new VersionedTransaction with the same data
      const tx = new VersionedTransaction(transactionData.transaction.message, signatures)
      const serializedTx = tx.serialize()
      const base64Tx = Buffer.from(serializedTx).toString('base64')

      const requestBody = {
        transaction_signature: transactionSignature,
        transaction_data: base64Tx,
        elgamal_signature: elGamalSignatureBase64,
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/audit-transaction`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      )

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${await response.text()}`)
      }

      const data = await response.json()
      setAuditResult(data)

      log.push({
        title: 'Audit Operation - COMPLETE',
        content: `Transaction audited successfully`,
        variant: 'success',
      })

      return data
    } catch (error) {
      console.error('Audit failed:', error)
      log.push({
        title: 'Audit Operation - FAILED',
        content: `Failed to audit transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'error',
      })

      if (error instanceof Error) {
        toast.error(`Audit failed: ${error.message}`)
      }

      setError(error instanceof Error ? error.message : 'Failed to audit transaction')
      return null
    } finally {
      setIsAuditing(false)
    }
  }

  return {
    auditTransaction,
    isAuditing,
    auditResult,
    error,
    reset: () => {
      setAuditResult(null)
      setError(null)
    },
  }
}
