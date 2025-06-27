'use client'

import { useState } from 'react'
import { getMint, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js'
import bs58 from 'bs58'
import { ELGAMAL_SEED_MESSAGE, generateSeedSignature } from '@/entities/account/account'
import { useOperationLog } from '@/entities/operation-log'
import { serverRequest } from '@/shared/api'
import { calculateUiAmount } from '@/shared/solana'
import { useToast } from '@/shared/ui/toast'

// Types for mint information
interface MintInfo {
  address: PublicKey
  decimals: number
  supply: bigint
  mintAuthority: PublicKey | null
  freezeAuthority: PublicKey | null
  isInitialized: boolean
}

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

      const { amount, mint } = await serverRequest<
        typeof requestBody,
        { amount: string; mint: string }
      >('/audit-transaction', requestBody)

      const mintInfo = await extractMintInfoByAddress(connection, mint)

      // Calculate UI amount from lamports using mint decimals
      const uiAmount = calculateUiAmount(amount, mintInfo.decimals)

      const auditResult = {
        mint,
        amount,
        uiAmount,
      }

      setAuditResult(auditResult)

      log.push({
        title: 'Audit Operation - COMPLETE',
        content: `Transaction audited successfully`,
        variant: 'success',
      })

      return auditResult
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

async function extractMintInfoByAddress(
  connection: Connection,
  mintAddress: string
): Promise<MintInfo> {
  try {
    // Convert string address to PublicKey
    const mintPublicKey = new PublicKey(mintAddress)

    // Fetch as Token-2022 mint since we're dealing with confidential transfers
    const mintInfo = await getMint(connection, mintPublicKey, 'confirmed', TOKEN_2022_PROGRAM_ID)

    return {
      address: mintPublicKey,
      decimals: mintInfo.decimals,
      supply: mintInfo.supply,
      mintAuthority: mintInfo.mintAuthority,
      freezeAuthority: mintInfo.freezeAuthority,
      isInitialized: mintInfo.isInitialized,
    }
  } catch (error) {
    console.error('Failed to fetch mint info:', error)
    throw new Error(
      `Failed to fetch mint information for address ${mintAddress}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
