'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { ELGAMAL_SEED_MESSAGE, generateSeedSignature } from '@/entities/account/account'
import { useOperationLog } from '@/entities/operation-log'
import { useToast } from '@/shared/ui/toast'

async function serverRequest(request: { elgamal_signature: string }) {
  const route = `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/reveal-elgamal-pubkey`
  const response = await fetch(route, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`😵 HTTP error! Status: ${response.status}`)
  }

  const data = await response.json()

  return data
}

export const useCreateElGamalKey = () => {
  const wallet = useWallet()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elGamalPubkey, setElGamalPubkey] = useState<string | null>(null)

  const log = useOperationLog()
  const toast = useToast()

  const generateElGamalKey = async () => {
    if (!wallet.signMessage || !wallet.publicKey) {
      setError('Wallet connection required')
      return null
    }

    setError(null)
    setIsGenerating(true)

    try {
      // Sign the ElGamal message
      const elGamalSignature = await generateSeedSignature(wallet, ELGAMAL_SEED_MESSAGE)
      const elGamalSignatureBase64 = Buffer.from(elGamalSignature).toString('base64')
      console.log('ElGamal base64 signature:', elGamalSignatureBase64)

      // Call the backend to reveal the public key
      const requestBody = {
        elgamal_signature: elGamalSignatureBase64,
      }

      const data = await serverRequest(requestBody)

      // Store the actual public key returned from the backend
      setElGamalPubkey(data.pubkey)

      log.push({
        title: 'ElGamal Key Generation - COMPLETE',
        content: `ElGamal public key revealed: ${data.pubkey}`,
        variant: 'success',
      })

      return data.pubkey
    } catch (error) {
      console.error('ElGamal key generation failed:', error)
      toast.error(`ElGamal key generation failed! ${error}`)
      log.push({
        title: 'ElGamal Key Generation - FAILED',
        content: `Failed to generate ElGamal key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'error',
      })

      setError(error instanceof Error ? error.message : 'Failed to generate ElGamal key')
      return null
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    generateElGamalKey,
    isGenerating,
    elGamalPubkey,
    error,
    reset: () => {
      setElGamalPubkey(null)
      setError(null)
    },
  }
}
