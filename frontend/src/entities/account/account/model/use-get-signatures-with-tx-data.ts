import { useConnection } from '@solana/wallet-adapter-react'
import { ConfirmedSignatureInfo, PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import { array, number, object, optional, string } from 'superstruct'

// Schema for transaction log messages
const TransactionLogSchema = object({
  meta: optional(
    object({
      logMessages: optional(array(string())),
      fee: optional(number()),
    })
  ),
  slot: optional(number()),
  blockTime: optional(number()),
})

/**
 * Enhanced signature info with confidential transfer data
 */
interface EnrichedSignatureInfo extends ConfirmedSignatureInfo {
  hasConfidentialTransfer?: boolean
  confidentialTransferMetadata?: ReturnType<typeof extractConfidentialTransferMetadata>
}

/**
 * Safely extracts log messages from a transaction using superstruct validation
 */
function getLogMessagesFromTransaction(transaction: any): string[] {
  try {
    const validatedTx = TransactionLogSchema.mask(transaction)
    return validatedTx.meta?.logMessages || []
  } catch (error) {
    console.warn('Failed to extract log messages from transaction:', error)
    return []
  }
}

/**
 * Checks if a transaction contains ConfidentialTransferInstruction::Transfer
 */
function isConfidentialTransferTransaction(transaction: any): boolean {
  try {
    // Extract log messages using validated structure
    const logMessages = getLogMessagesFromTransaction(transaction)

    // Look for the specific log message that indicates ConfidentialTransferInstruction::Transfer
    // NOTE: this is the simplified approach to mark the transactions that belong to Transfer
    // Consider improving that logic for a real project
    return logMessages.some((logMessage: string) =>
      logMessage.includes('Program log: ConfidentialTransferInstruction::Transfer')
    )
  } catch (error) {
    console.warn('Failed to check transaction log messages:', error)
    return false
  }
}

/**
 * Extracts confidential transfer metadata from a transaction
 */
function extractConfidentialTransferMetadata(transaction: any): {
  hasConfidentialTransfer: boolean
  metadata: {
    slot?: number
    blockTime?: number
    fee?: number
  }
} {
  try {
    console.log('Extracting confidential transfer metadata from transaction')

    // Validate transaction structure using superstruct
    const validatedTx = TransactionLogSchema.mask(transaction)

    const hasConfidentialTransfer = isConfidentialTransferTransaction(transaction)

    return {
      hasConfidentialTransfer,
      metadata: {
        slot: validatedTx.slot,
        blockTime: validatedTx.blockTime,
        fee: validatedTx.meta?.fee,
      },
    }
  } catch (error) {
    console.warn('Failed to extract confidential transfer metadata:', error)
    return {
      hasConfidentialTransfer: false,
      metadata: {},
    }
  }
}

export const queryKey = (endpoint: string, address: PublicKey) => [
  'get-signaures-with-tx',
  { endpoint, address },
]

export const useGetSignaturesWithTxData = ({ address }: { address: PublicKey }) => {
  const { connection } = useConnection()

  return useQuery({
    queryKey: queryKey(connection.rpcEndpoint, address),
    queryFn: async (): Promise<EnrichedSignatureInfo[]> => {
      const result = await connection.getSignaturesForAddress(address)
      const signatures = result.map((signatureInfo) => signatureInfo.signature)

      // Get all transaction data in batch
      const txs = await connection.getParsedTransactions(signatures, {
        maxSupportedTransactionVersion: 0,
      })

      // Enrich signature info with transaction data
      const enrichedSignatures: EnrichedSignatureInfo[] = []

      for (let i = 0; i < result.length; i++) {
        const signatureInfo = result[i]
        const transaction = txs[i]

        if (transaction) {
          // Extract confidential transfer metadata
          const confidentialTransferMetadata = extractConfidentialTransferMetadata(transaction)

          enrichedSignatures.push({
            ...signatureInfo,
            hasConfidentialTransfer: confidentialTransferMetadata.hasConfidentialTransfer,
            confidentialTransferMetadata,
          })
        }
      }

      console.log('Enriched signatures:', enrichedSignatures)
      return enrichedSignatures
    },
  })
}
