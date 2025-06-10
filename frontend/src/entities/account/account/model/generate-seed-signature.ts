import { WalletContextState } from '@solana/wallet-adapter-react'

export const generateSeedSignatureMessage = async (
  wallet: WalletContextState,
  message: Uint8Array
) => {
  if (!wallet.publicKey) {
    throw new Error('Wallet public key is undefined')
  }

  // IMPORTANT: For spl-token CLI compatibility, the public seed is an empty byte array,
  // not the wallet's public key. This matches the Rust code:
  // https://github.com/solana-program/token-2022/blob/9730044abe4f2ac62afeb010dc0a5ffc8a9fbadc/clients/cli/src/command.rs#L4695
  const emptyPublicSeed = new Uint8Array(0) // Empty byte array

  const messageToSign = Buffer.concat([message, emptyPublicSeed])

  console.log('Full message to sign (hex):', Buffer.from(messageToSign).toString('hex'))

  return messageToSign
}

export const generateSeedSignature = async (wallet: WalletContextState, message: Uint8Array) => {
  const messageToSign = await generateSeedSignatureMessage(wallet, message)

  // Sign the message
  if (!wallet.signMessage) {
    throw new Error('Wallet signMessage function is unavailable.')
  }

  const signature = await wallet.signMessage(messageToSign)

  return signature
}
