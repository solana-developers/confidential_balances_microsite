import { Connection, VersionedTransaction } from '@solana/web3.js'

export const processMultiTransaction = async (
  transactions: string[],
  wallet: any,
  connection: Connection,
  latestBlockhash: { blockhash: string; lastValidBlockHeight: number },
  operationType = 'Transaction'
): Promise<{ signatures: string[]; transactions: VersionedTransaction[] }> => {
  const signatures: string[] = []

  // Deserialize and prepare transactions
  const deserializedTransactions: VersionedTransaction[] = transactions
    .map((txData: string) => Buffer.from(txData, 'base64'))
    .map((txData: Buffer) => VersionedTransaction.deserialize(txData))

  const signedTransactions = await wallet.signAllTransactions!(deserializedTransactions)

  for (const txn of signedTransactions) {
    console.log('Simulating transaction before sending...')
    const simulation = await connection.simulateTransaction(txn, {
      // Default [SimulateTransactionConfig]
    })

    if (simulation.value.err) {
      console.error('Transaction simulation failed:', simulation.value.err)
      throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`)
    }

    console.log('Transaction simulation successful, proceeding to send')
    const signature = await connection.sendTransaction(txn)
    signatures.push(signature)

    // Confirm the transaction
    await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')
    console.log(`${operationType} signature:`, signature)
  }

  return {
    signatures,
    transactions: signedTransactions,
  }
}
