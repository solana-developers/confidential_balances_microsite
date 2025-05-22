"use client";

import {
  getAccount,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  Account,
  unpackAccount,
  unpackMint,
  Mint,
} from "@solana/spl-token";
import {
  useConnection,
  useWallet,
  WalletContextState,
} from "@solana/wallet-adapter-react";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTransactionToast } from "../ui/ui-layout";
import { getMint } from "@solana/spl-token";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { useState } from "react";

// Source: https://github.com/anza-xyz/agave/blob/d58415068289a0e030d91d2bbb5680f752947ff6/zk-sdk/src/encryption/elgamal.rs#L516
const ELGAMAL_SEED_MESSAGE = Buffer.from("ElGamalSecretKey");

// Source: https://github.com/anza-xyz/agave/blob/d58415068289a0e030d91d2bbb5680f752947ff6/zk-sdk/src/encryption/auth_encryption.rs#L136
const AES_SEED_MESSAGE = Buffer.from("AeKey");

async function generateSeedSignature(
  wallet: WalletContextState,
  message: Uint8Array,
) {
  if (!wallet.publicKey) {
    throw new Error("Wallet public key is undefined");
  }

  // IMPORTANT: For spl-token CLI compatibility, the public seed is an empty byte array,
  // not the wallet's public key. This matches the Rust code:
  // https://github.com/solana-program/token-2022/blob/9730044abe4f2ac62afeb010dc0a5ffc8a9fbadc/clients/cli/src/command.rs#L4695
  const emptyPublicSeed = new Uint8Array(0); // Empty byte array

  const messageToSign = Buffer.concat([message, emptyPublicSeed]);

  console.log(
    "Full message to sign (hex):",
    Buffer.from(messageToSign).toString("hex"),
  );

  // Sign the message
  if (!wallet.signMessage) {
    throw new Error("Wallet signMessage function is unavailable.");
  }

  const signature = await wallet.signMessage(messageToSign);

  return signature;
}

export function useGetBalance({ address }: { address: PublicKey }) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ["get-balance", { endpoint: connection.rpcEndpoint, address }],
    queryFn: () => connection.getBalance(address),
  });
}

export function useGetSignatures({ address }: { address: PublicKey }) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ["get-signatures", { endpoint: connection.rpcEndpoint, address }],
    queryFn: () => connection.getSignaturesForAddress(address),
  });
}

export function useGetTokenAccounts({ address }: { address: PublicKey }) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: [
      "get-token-accounts",
      { endpoint: connection.rpcEndpoint, address },
    ],
    queryFn: async () => {
      const [tokenAccounts, token2022Accounts] = await Promise.all([
        connection.getParsedTokenAccountsByOwner(address, {
          programId: TOKEN_PROGRAM_ID,
        }),
        connection.getParsedTokenAccountsByOwner(address, {
          programId: TOKEN_2022_PROGRAM_ID,
        }),
      ]);
      return [...tokenAccounts.value, ...token2022Accounts.value];
    },
  });
}

// New hook for getting token balance
export function useGetTokenBalance({
  tokenAccountPubkey,
}: {
  tokenAccountPubkey: PublicKey;
}) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: [
      "get-token-balance",
      {
        endpoint: connection.rpcEndpoint,
        tokenAccountPubkey: tokenAccountPubkey.toString(),
      },
    ],
    queryFn: async () => {
      try {
        const response =
          await connection.getTokenAccountBalance(tokenAccountPubkey);
        return response?.value?.uiAmountString || "0";
      } catch (error) {
        console.error("Error fetching token balance:", error);
        throw error;
      }
    },
    retry: 3,
  });
}

// Simple hook to manage confidential balance visibility
export function useConfidentialVisibility(tokenAccountPubkey: PublicKey) {
  const client = useQueryClient();
  const queryKey = ["confidential-visibility", tokenAccountPubkey.toString()];

  // Get current visibility state
  const { data: isVisible = false } = useQuery({
    queryKey,
    queryFn: () => false, // Default to hidden
    staleTime: Infinity, // Don't refetch automatically
  });

  // Function to show confidential balance
  const showBalance = () => {
    client.setQueryData(queryKey, true);
  };

  // Function to hide confidential balance
  const hideBalance = () => {
    client.setQueryData(queryKey, false);
  };

  return { isVisible, showBalance, hideBalance };
}

// Hook to check if token account has pending balance
export function useHasPendingBalance({
  tokenAccountPubkey,
}: {
  tokenAccountPubkey: PublicKey;
}) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: [
      "has-pending-balance",
      {
        endpoint: connection.rpcEndpoint,
        tokenAccountPubkey: tokenAccountPubkey.toString(),
      },
    ],
    queryFn: async () => {
      try {
        // Get token account info
        const accountInfo =
          await connection.getParsedAccountInfo(tokenAccountPubkey);

        // Check if account exists and has data
        if (
          !accountInfo?.value?.data ||
          typeof accountInfo.value.data !== "object"
        ) {
          console.log("No account data found for pending balance check");
          return false;
        }

        const parsedData = accountInfo.value.data;

        // Check for token account with extensions
        if ("parsed" in parsedData && parsedData.parsed?.info?.extensions) {
          // Find confidentialTransferAccount extension
          const ctExtension = parsedData.parsed.info.extensions.find(
            (ext: any) => ext.extension === "confidentialTransferAccount",
          );

          // If we found the extension and it has a state
          if (ctExtension?.state) {
            // Check if pendingBalanceCreditCounter is greater than 0
            const pendingCounter =
              ctExtension.state.pendingBalanceCreditCounter;

            // Log the pending counter value for debugging
            console.log("Pending balance credit counter:", pendingCounter);

            if (typeof pendingCounter === "number" && pendingCounter > 0) {
              console.log(
                "Detected pending balance for account:",
                tokenAccountPubkey.toString(),
              );
              return true;
            }
          } else {
            console.log(
              "No confidentialTransferAccount state found in extension",
            );
          }
        } else {
          console.log("No extensions found in token account");
        }

        return false;
      } catch (error) {
        console.error("Error checking for pending balance:", error);
        return false;
      }
    },
    // Refetch regularly to check for changes
    refetchInterval: 10000, // Check every 10 seconds
    // Stale time to reduce unnecessary fetches
    staleTime: 5000, // Consider data fresh for 5 seconds
    // Retry on error
    retry: 3,
  });
}

export function useTransferSol({ address }: { address: PublicKey }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();
  const client = useQueryClient();

  return useMutation({
    mutationKey: [
      "transfer-sol",
      { endpoint: connection.rpcEndpoint, address },
    ],
    mutationFn: async (input: { destination: PublicKey; amount: number }) => {
      let signature: TransactionSignature = "";
      try {
        const { transaction, latestBlockhash } = await createTransaction({
          publicKey: address,
          destination: input.destination,
          amount: input.amount,
          connection,
        });

        // Send transaction and await for signature
        signature = await wallet.sendTransaction(transaction, connection);

        // Send transaction and await for signature
        await connection.confirmTransaction(
          { signature, ...latestBlockhash },
          "confirmed",
        );

        console.log(signature);
        return signature;
      } catch (error: unknown) {
        console.log("error", `Transaction failed! ${error}`, signature);

        return;
      }
    },
    onSuccess: (signature) => {
      if (signature) {
        transactionToast(signature);
      }
      return Promise.all([
        client.invalidateQueries({
          queryKey: [
            "get-balance",
            { endpoint: connection.rpcEndpoint, address },
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            "get-signatures",
            { endpoint: connection.rpcEndpoint, address },
          ],
        }),
      ]);
    },
    onError: (error) => {
      toast.error(`Transaction failed! ${error}`);
    },
  });
}

export function useRequestAirdrop({ address }: { address: PublicKey }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const client = useQueryClient();

  return useMutation({
    mutationKey: ["airdrop", { endpoint: connection.rpcEndpoint, address }],
    mutationFn: async (amount: number = 1) => {
      const [latestBlockhash, signature] = await Promise.all([
        connection.getLatestBlockhash(),
        connection.requestAirdrop(address, amount * LAMPORTS_PER_SOL),
      ]);

      await connection.confirmTransaction(
        { signature, ...latestBlockhash },
        "confirmed",
      );
      return signature;
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      return Promise.all([
        client.invalidateQueries({
          queryKey: [
            "get-balance",
            { endpoint: connection.rpcEndpoint, address },
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            "get-signatures",
            { endpoint: connection.rpcEndpoint, address },
          ],
        }),
      ]);
    },
  });
}

async function createTransaction({
  publicKey,
  destination,
  amount,
  connection,
}: {
  publicKey: PublicKey;
  destination: PublicKey;
  amount: number;
  connection: Connection;
}): Promise<{
  transaction: VersionedTransaction;
  latestBlockhash: { blockhash: string; lastValidBlockHeight: number };
}> {
  // Get the latest blockhash to use in our transaction
  const latestBlockhash = await connection.getLatestBlockhash();

  // Create instructions to send, in this case a simple transfer
  const instructions = [
    SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: destination,
      lamports: amount * LAMPORTS_PER_SOL,
    }),
  ];

  // Create a new TransactionMessage with version and compile it to legacy
  const messageLegacy = new TransactionMessage({
    payerKey: publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions,
  }).compileToLegacyMessage();

  // Create a new VersionedTransaction which supports legacy and v0
  const transaction = new VersionedTransaction(messageLegacy);

  return {
    transaction,
    latestBlockhash,
  };
}

export function useGetSingleTokenAccount({ address }: { address: PublicKey }) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: [
      "get-single-token-account",
      { endpoint: connection.rpcEndpoint, address },
    ],
    queryFn: async () => {
      try {
        // First, check if the account exists and what program owns it
        const accountInfo = await connection.getAccountInfo(
          address,
          "confirmed",
        );

        // If account doesn't exist at all
        if (!accountInfo) {
          return {
            tokenAccount: null,
            error: null,
            reason: "Account does not exist",
          };
        }

        // Check if the account is owned by either Token Program
        const isOwnedByTokenProgram =
          accountInfo.owner.equals(TOKEN_PROGRAM_ID) ||
          accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID);

        if (!isOwnedByTokenProgram) {
          return {
            tokenAccount: null,
            error: null,
            reason: "Account is not owned by Token Program",
          };
        }

        // Now we know it's likely a token account, try to parse it
        // First try TOKEN_2022_PROGRAM_ID
        try {
          const tokenAccount = await getAccount(
            connection,
            address,
            "confirmed",
            TOKEN_2022_PROGRAM_ID,
          );
          return {
            tokenAccount,
            error: null,
            reason: null,
          };
        } catch (token2022Error) {
          // If that fails, try the regular TOKEN_PROGRAM_ID
          try {
            const tokenAccount = await getAccount(
              connection,
              address,
              "confirmed",
              TOKEN_PROGRAM_ID,
            );
            return {
              tokenAccount,
              error: null,
              reason: null,
            };
          } catch (tokenError) {
            // If both fail but the account is owned by a token program,
            // it's likely a token account with an unexpected structure
            return {
              tokenAccount: null,
              error:
                "Account is owned by Token Program but could not be parsed as a token account",
              reason: "Failed to parse token account data",
            };
          }
        }
      } catch (error: any) {
        // This is an actual error (network error, etc.)
        console.error("Error fetching account info:", error);
        return {
          tokenAccount: null,
          error: error.message || "Unknown error",
          reason: "Network or RPC error",
        };
      }
    },
    // Set an initial data value to ensure data is never undefined
    initialData: {
      tokenAccount: null,
      error: null,
      reason: "Query not started",
    },
  });
}

export function useCreateAssociatedTokenAccountCB({
  walletAddressPubkey,
}: {
  walletAddressPubkey: PublicKey;
}) {
  const { connection } = useConnection();
  const client = useQueryClient();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();

  return useMutation({
    mutationKey: [
      "initialize-account",
      { endpoint: connection.rpcEndpoint, walletAddressPubkey },
    ],
    mutationFn: async (params: { mintAddress: string }) => {
      try {
        // First, sign the message ELGAMAL_SEED_MESSAGE
        if (!wallet.signMessage) {
          throw new Error("Wallet does not support message signing");
        }

        // Sign the ElGamal message
        const elGamalSignature = await generateSeedSignature(
          wallet,
          ELGAMAL_SEED_MESSAGE,
        );
        const elGamalSignatureBase64 =
          Buffer.from(elGamalSignature).toString("base64");
        console.log("ElGamal base64 signature:", elGamalSignatureBase64);

        // Sign the AES message
        const aesSignature = await generateSeedSignature(
          wallet,
          AES_SEED_MESSAGE,
        );
        const aesSignatureBase64 = Buffer.from(aesSignature).toString("base64");
        console.log("AES base64 signature:", aesSignatureBase64);

        const mintAddress = params.mintAddress;
        const mintBase64 = Buffer.from(mintAddress).toString("base64");
        const authorityBase64 = Buffer.from(
          walletAddressPubkey.toString(),
        ).toString("base64");

        // Now proceed with the transaction
        const route = `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/create-cb-ata`;
        const response = await fetch(route, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mint: mintBase64,
            ata_authority: authorityBase64,
            elgamal_signature: elGamalSignatureBase64,
            aes_signature: aesSignatureBase64,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        // Deserialize the transaction from the response
        const serializedTransaction = Buffer.from(data.transaction, "base64");
        const transaction = VersionedTransaction.deserialize(
          serializedTransaction,
        );

        // Get the latest blockhash for transaction confirmation
        const latestBlockhash = await connection.getLatestBlockhash();

        // Update the transaction's blockhash
        if (transaction.message.version === 0) {
          // For VersionedMessage V0
          transaction.message.recentBlockhash = latestBlockhash.blockhash;
        } else {
          // For legacy messages
          (transaction.message as any).recentBlockhash =
            latestBlockhash.blockhash;
        }

        // Sign and send the transaction
        const signature = await wallet.sendTransaction(transaction, connection);

        // Confirm the transaction
        await connection.confirmTransaction(
          { signature, ...latestBlockhash },
          "confirmed",
        );

        console.log("Transaction signature:", signature);
        return {
          signature,
          elGamalSignature: elGamalSignatureBase64,
          aesSignature: aesSignatureBase64,
          ...data,
        };
      } catch (error) {
        console.error("Error initializing account:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.signature) {
        transactionToast(data.signature);
        toast.success("Account initialize txn created ");
      }

      // Invalidate relevant queries to refresh data
      return Promise.all([
        client.invalidateQueries({
          queryKey: [
            "get-balance",
            { endpoint: connection.rpcEndpoint, walletAddressPubkey },
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            "get-signatures",
            { endpoint: connection.rpcEndpoint, walletAddressPubkey },
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            "get-token-accounts",
            { endpoint: connection.rpcEndpoint, walletAddressPubkey },
          ],
        }),
      ]);
    },
    onError: (error) => {
      if (error instanceof Error && error.message.includes("message signing")) {
        toast.error(`Message signing failed: ${error.message}`);
      } else {
        toast.error(`Initialization failed! ${error}`);
      }
    },
  });
}

export function useDepositCb({
  tokenAccountPubkey,
}: {
  tokenAccountPubkey: PublicKey;
}) {
  const { connection } = useConnection();
  const client = useQueryClient();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();

  return useMutation({
    mutationKey: [
      "deposit-cb",
      { endpoint: connection.rpcEndpoint, tokenAccountPubkey },
    ],
    mutationFn: async ({ lamportAmount }: { lamportAmount: string }) => {
      try {
        if (!wallet.publicKey) {
          throw new Error("Wallet not connected");
        }

        // Get ATA account info
        const ataAccountInfo =
          await connection.getAccountInfo(tokenAccountPubkey);
        if (!ataAccountInfo) {
          throw new Error("Account not found");
        }

        // Get mint decimals using a temporary scope
        const decimals = await (async () => {
          const splTokenAccount = await getAccount(
            connection,
            tokenAccountPubkey,
            "confirmed",
            TOKEN_2022_PROGRAM_ID,
          );

          const mint = await getMint(
            connection,
            splTokenAccount.mint,
            "confirmed",
            TOKEN_2022_PROGRAM_ID,
          );

          return mint.decimals;
        })();

        // Call the deposit-cb endpoint
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/deposit-cb`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token_account_data: Buffer.from(ataAccountInfo.data).toString(
                "base64",
              ),
              lamport_amount: lamportAmount,
              mint_decimals: decimals,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        // Deserialize the transaction from the response
        const serializedTransaction = Buffer.from(data.transaction, "base64");
        const transaction = VersionedTransaction.deserialize(
          serializedTransaction,
        );

        // Get the latest blockhash for transaction confirmation
        const latestBlockhash = await connection.getLatestBlockhash();

        // Update the transaction's blockhash
        if (transaction.message.version === 0) {
          // For VersionedMessage V0
          transaction.message.recentBlockhash = latestBlockhash.blockhash;
        } else {
          // For legacy messages
          (transaction.message as any).recentBlockhash =
            latestBlockhash.blockhash;
        }

        // Sign and send the transaction
        const signature = await wallet.sendTransaction(transaction, connection);

        // Confirm the transaction
        await connection.confirmTransaction(
          { signature, ...latestBlockhash },
          "confirmed",
        );

        console.log("Deposit transaction signature:", signature);
        return {
          signature,
          ...data,
        };
      } catch (error) {
        console.error(
          "Error depositing to confidential balance account:",
          error,
        );
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.signature) {
        transactionToast(data.signature);
        toast.success("Deposit transaction successful");
        console.log(
          "Deposit transaction successful with signature:",
          data.signature,
        );
      }

      // Log that we're going to invalidate the has-pending-balance query
      console.log(
        "Invalidating has-pending-balance query after successful deposit",
      );

      // Invalidate relevant queries to refresh data
      return Promise.all([
        client.invalidateQueries({
          queryKey: [
            "get-balance",
            { endpoint: connection.rpcEndpoint, tokenAccountPubkey },
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            "get-signatures",
            { endpoint: connection.rpcEndpoint, tokenAccountPubkey },
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            "get-token-accounts",
            { endpoint: connection.rpcEndpoint, tokenAccountPubkey },
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            "get-token-balance",
            {
              endpoint: connection.rpcEndpoint,
              tokenAccountPubkey: tokenAccountPubkey.toString(),
            },
          ],
        }),
        client
          .invalidateQueries({
            queryKey: [
              "has-pending-balance",
              {
                endpoint: connection.rpcEndpoint,
                tokenAccountPubkey: tokenAccountPubkey.toString(),
              },
            ],
          })
          .then(() => {
            console.log(
              "Successfully invalidated has-pending-balance query, will trigger refetch",
            );
          }),
      ]).then(() => {
        console.log("All queries invalidated after deposit");
      });
    },
    onError: (error) => {
      toast.error(`Deposit failed! ${error}`);
    },
  });
}

// Add a hook to get mint account information
export function useGetMintInfo({
  mintAddress,
  enabled = true,
}: {
  mintAddress: string;
  enabled?: boolean;
}) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: [
      "get-mint-info",
      { endpoint: connection.rpcEndpoint, mintAddress },
    ],
    queryFn: async () => {
      try {
        const mintPublicKey = new PublicKey(mintAddress);

        // Try to get the mint info using Token-2022 program first
        try {
          console.log(
            "Attempting to fetch mint info using Token-2022 program...",
          );
          const mintInfo = await getMint(
            connection,
            mintPublicKey,
            "confirmed",
            TOKEN_2022_PROGRAM_ID,
          );
          console.log("Successfully fetched Token-2022 mint:", mintInfo);
          return {
            ...mintInfo,
            isToken2022: true,
          };
        } catch (error) {
          console.log(
            "Not a Token-2022 mint, trying standard Token program...",
            error,
          );

          // If that fails, try the standard Token program
          try {
            const mintInfo = await getMint(
              connection,
              mintPublicKey,
              "confirmed",
              TOKEN_PROGRAM_ID,
            );
            console.log("Successfully fetched standard Token mint:", mintInfo);
            return {
              ...mintInfo,
              isToken2022: false,
            };
          } catch (secondError) {
            console.error(
              "Failed to fetch mint with standard Token program:",
              secondError,
            );

            // Check if the account exists but is not a token mint
            const accountInfo = await connection.getAccountInfo(mintPublicKey);
            if (accountInfo) {
              console.log(
                "Account exists but is not a token mint:",
                accountInfo,
              );
              throw new Error(
                `Account exists but is not owned by a Token program. Owner: ${accountInfo.owner.toBase58()}`,
              );
            } else {
              console.log("Account does not exist");
              throw new Error("Mint account does not exist");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching mint info:", error);
        throw error;
      }
    },
    enabled: enabled && !!mintAddress,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useApplyCB({ address }: { address: PublicKey }) {
  const { connection } = useConnection();
  const client = useQueryClient();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();

  return useMutation({
    mutationKey: [
      "apply-pending-balance",
      { endpoint: connection.rpcEndpoint, address },
    ],
    mutationFn: async () => {
      try {
        // First, sign the messages for ElGamal and AES
        if (!wallet.signMessage) {
          throw new Error("Wallet does not support message signing");
        }

        // Sign the ElGamal message
        const elGamalSignature = await generateSeedSignature(
          wallet,
          ELGAMAL_SEED_MESSAGE,
        );
        const elGamalSignatureBase64 =
          Buffer.from(elGamalSignature).toString("base64");
        console.log("ElGamal base64 signature:", elGamalSignatureBase64);

        // Sign the AES message
        const aesSignature = await generateSeedSignature(
          wallet,
          AES_SEED_MESSAGE,
        );
        const aesSignatureBase64 = Buffer.from(aesSignature).toString("base64");
        console.log("AES base64 signature:", aesSignatureBase64);

        // Get the token account address from the provided string
        const tokenAccountAddress = new PublicKey(address);

        // Fetch the token account data
        const accountInfo =
          await connection.getAccountInfo(tokenAccountAddress);
        if (!accountInfo) {
          throw new Error("Token account not found");
        }

        // Prepare the request to the backend
        // Convert pubkeys to base58 strings and then base64 encode them
        const ataAuthorityBase58 = await (async () => {
          const tokenAccountInfo = await getAccount(
            connection,
            address,
            "confirmed",
            TOKEN_2022_PROGRAM_ID,
          );
          return tokenAccountInfo.owner.toBase58();
        })();

        const request = {
          ata_authority: Buffer.from(ataAuthorityBase58).toString("base64"),
          elgamal_signature: elGamalSignatureBase64,
          aes_signature: aesSignatureBase64,
          token_account_data: Buffer.from(accountInfo.data).toString("base64"),
        };

        // Send the request to the backend
        const route = `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/apply-cb`;
        const response = await fetch(route, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        // Deserialize the transaction from the response
        const serializedTransaction = Buffer.from(data.transaction, "base64");
        const transaction = VersionedTransaction.deserialize(
          serializedTransaction,
        );

        // Get the latest blockhash for transaction confirmation
        const latestBlockhash = await connection.getLatestBlockhash();

        // Update the transaction's blockhash
        if (transaction.message.version === 0) {
          // For VersionedMessage V0
          transaction.message.recentBlockhash = latestBlockhash.blockhash;
        } else {
          // For legacy messages
          (transaction.message as any).recentBlockhash =
            latestBlockhash.blockhash;
        }

        // Sign and send the transaction
        const signature = await wallet.sendTransaction(
          transaction,
          connection,
          {
            skipPreflight: true, // Skip client-side verification to avoid potential issues
          },
        );

        // Confirm the transaction
        await connection.confirmTransaction(
          { signature, ...latestBlockhash },
          "confirmed",
        );

        console.log("Apply pending balance transaction signature:", signature);
        return {
          signature,
          elGamalSignature: elGamalSignatureBase64,
          aesSignature: aesSignatureBase64,
          ...data,
        };
      } catch (error) {
        console.error("Error applying pending balance:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.signature) {
        transactionToast(data.signature);
        toast.success("Pending balance applied successfully");
      }

      // Hide confidential balance using query cache
      client.setQueryData(
        ["confidential-visibility", address.toString()],
        false,
      );

      // Directly set has-pending-balance to false to hide the prompt
      console.log(
        "Setting has-pending-balance to false after successful apply",
      );
      client.setQueryData(
        [
          "has-pending-balance",
          {
            endpoint: connection.rpcEndpoint,
            tokenAccountPubkey: address.toString(),
          },
        ],
        false,
      );

      // Invalidate relevant queries to refresh data
      return Promise.all([
        client.invalidateQueries({
          queryKey: [
            "get-balance",
            { endpoint: connection.rpcEndpoint, address },
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            "get-signatures",
            { endpoint: connection.rpcEndpoint, address },
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            "get-token-accounts",
            { endpoint: connection.rpcEndpoint, address },
          ],
        }),
      ]);
    },
    onError: (error) => {
      if (error instanceof Error && error.message.includes("message signing")) {
        toast.error(`Message signing failed: ${error.message}`);
      } else {
        toast.error(`Failed to apply pending balance: ${error}`);
      }
    },
  });
}

async function processMultiTransaction(
  transactions: string[],
  wallet: any,
  connection: Connection,
  latestBlockhash: { blockhash: string; lastValidBlockHeight: number },
  operationType = "Transaction",
): Promise<{ signatures: string[]; transactions: VersionedTransaction[] }> {
  const signatures: string[] = [];

  // Deserialize and prepare transactions
  const deserializedTransactions: VersionedTransaction[] = transactions
    .map((txData: string) => Buffer.from(txData, "base64"))
    .map((txData: Buffer) => VersionedTransaction.deserialize(txData));

  const signedTransactions = await wallet.signAllTransactions!(
    deserializedTransactions,
  );

  for (const txn of signedTransactions) {
    console.log("Simulating transaction before sending...");
    const simulation = await connection.simulateTransaction(txn, {
      // Default [SimulateTransactionConfig]
    });

    if (simulation.value.err) {
      console.error("Transaction simulation failed:", simulation.value.err);
      throw new Error(
        `Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`,
      );
    }

    console.log("Transaction simulation successful, proceeding to send");
    const signature = await connection.sendTransaction(txn);
    signatures.push(signature);

    // Confirm the transaction
    await connection.confirmTransaction(
      { signature, ...latestBlockhash },
      "confirmed",
    );
    console.log(`${operationType} signature:`, signature);
  }

  return {
    signatures,
    transactions: signedTransactions,
  };
}

export function useTransferCB({
  senderTokenAccountPubkey,
}: {
  senderTokenAccountPubkey: PublicKey;
}) {
  const { connection } = useConnection();
  const client = useQueryClient();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();

  return useMutation({
    mutationKey: [
      "transfer-cb",
      { endpoint: connection.rpcEndpoint, senderTokenAccountPubkey },
    ],
    mutationFn: async ({
      amount,
      recipientAddress,
      mintAddress,
    }: {
      amount: number;
      recipientAddress: string;
      mintAddress: string;
    }) => {
      try {
        if (!wallet.publicKey) {
          throw new Error("Wallet not connected");
        }

        // First, sign the messages for ElGamal and AES
        if (!wallet.signMessage) {
          throw new Error("Wallet does not support message signing");
        }

        // Sign the ElGamal message
        const elGamalSignature = await generateSeedSignature(
          wallet,
          ELGAMAL_SEED_MESSAGE,
        );
        const elGamalSignatureBase64 =
          Buffer.from(elGamalSignature).toString("base64");
        console.log("ElGamal base64 signature:", elGamalSignatureBase64);

        // Sign the AES message
        const aesSignature = await generateSeedSignature(
          wallet,
          AES_SEED_MESSAGE,
        );
        const aesSignatureBase64 = Buffer.from(aesSignature).toString("base64");
        console.log("AES base64 signature:", aesSignatureBase64);

        // Get the token account data for sender
        const senderATAInfo = await (async () => {
          const acctInfo = await connection.getAccountInfo(
            senderTokenAccountPubkey,
          );
          if (!acctInfo) {
            throw new Error("Sender token account not found");
          }
          return acctInfo;
        })();

        // Get the token account data for recipient
        const recipientATAInfo = await (async () => {
          const recipientTokenAccountPubkey = new PublicKey(recipientAddress);
          const acctInfo = await connection.getAccountInfo(
            recipientTokenAccountPubkey,
          );
          if (!acctInfo) {
            throw new Error("Recipient token account not found");
          }
          return acctInfo;
        })();

        // Get the mint account data
        const mintAccountInfo = await (async () => {
          const mintAccountPubkey = new PublicKey(mintAddress);
          const acctInfo = await connection.getAccountInfo(mintAccountPubkey);
          if (!acctInfo) {
            throw new Error("Mint account not found");
          }
          return acctInfo;
        })();

        // Get the latest blockhash
        const latestBlockhash = await connection.getLatestBlockhash();

        // Step 1: Get the space requirements for each proof account
        console.log("Fetching proof space requirements...");
        const spaceResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/transfer-cb`,
          {
            method: "GET",
          },
        );

        if (!spaceResponse.ok) {
          throw new Error(
            `HTTP error getting space requirements! Status: ${spaceResponse.status}`,
          );
        }

        const spaceData = await spaceResponse.json();
        console.log("Space requirements:", spaceData);

        // Step 2: Calculate rent for each proof account
        console.log("Calculating rent for proof accounts...");
        const equalityProofRent =
          await connection.getMinimumBalanceForRentExemption(
            spaceData.equality_proof_space,
          );
        const ciphertextValidityProofRent =
          await connection.getMinimumBalanceForRentExemption(
            spaceData.ciphertext_validity_proof_space,
          );
        const rangeProofRent =
          await connection.getMinimumBalanceForRentExemption(
            spaceData.range_proof_space,
          );

        console.log("Rent requirements:");
        console.log("- Equality proof rent:", equalityProofRent, "lamports");
        console.log(
          "- Ciphertext validity proof rent:",
          ciphertextValidityProofRent,
          "lamports",
        );
        console.log("- Range proof rent:", rangeProofRent, "lamports");

        // Step 3: Call the transfer-cb endpoint with rent information
        console.log("Submitting transfer request...");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/transfer-cb`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              elgamal_signature: elGamalSignatureBase64,
              aes_signature: aesSignatureBase64,
              sender_token_account: Buffer.from(senderATAInfo.data).toString(
                "base64",
              ),
              recipient_token_account: Buffer.from(
                recipientATAInfo.data,
              ).toString("base64"),
              mint_token_account: Buffer.from(mintAccountInfo.data).toString(
                "base64",
              ),
              amount: amount.toString(), // Convert to string to avoid precision issues with large numbers
              priority_fee: "100000000", // Add 0.1 SOL (10,000,000 lamports) priority fee as string
              latest_blockhash: latestBlockhash.blockhash,
              equality_proof_rent: equalityProofRent.toString(),
              ciphertext_validity_proof_rent:
                ciphertextValidityProofRent.toString(),
              range_proof_rent: rangeProofRent.toString(),
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        const { signatures } = await processMultiTransaction(
          data.transactions,
          wallet,
          connection,
          latestBlockhash,
          "Transfer",
        );

        return {
          signatures,
          ...data,
        };
      } catch (error) {
        console.error("Error processing transaction:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.signatures && data.signatures.length > 0) {
        // Display toast for each signature
        data.signatures.forEach((signature: string) => {
          transactionToast(signature);
        });
        toast.success("Transfer transaction successful");
      }

      // Hide confidential balance using query cache
      client.setQueryData(
        ["confidential-visibility", senderTokenAccountPubkey.toString()],
        false,
      );

      // Invalidate relevant queries to refresh data
      return Promise.all([
        client.invalidateQueries({
          queryKey: [
            "get-balance",
            { endpoint: connection.rpcEndpoint, senderTokenAccountPubkey },
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            "get-signatures",
            { endpoint: connection.rpcEndpoint, senderTokenAccountPubkey },
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            "get-token-accounts",
            { endpoint: connection.rpcEndpoint, senderTokenAccountPubkey },
          ],
        }),
      ]);
    },
    onError: (error) => {
      toast.error(`Transfer failed! ${error}`);
    },
  });
}

export function useWithdrawCB({
  tokenAccountPubkey,
}: {
  tokenAccountPubkey: PublicKey;
}) {
  const { connection } = useConnection();
  const client = useQueryClient();
  const transactionToast = useTransactionToast();
  const wallet = useWallet();

  return useMutation({
    mutationKey: [
      "withdraw-cb",
      { endpoint: connection.rpcEndpoint, tokenAccountPubkey },
    ],
    mutationFn: async ({ amount }: { amount: number }) => {
      try {
        if (!wallet.publicKey) {
          throw new Error("Wallet not connected");
        }

        // First, sign the messages for ElGamal and AES
        if (!wallet.signMessage) {
          throw new Error("Wallet does not support message signing");
        }

        // Sign the ElGamal message
        const elGamalSignature = await generateSeedSignature(
          wallet,
          ELGAMAL_SEED_MESSAGE,
        );
        const elGamalSignatureBase64 =
          Buffer.from(elGamalSignature).toString("base64");
        console.log("ElGamal base64 signature:", elGamalSignatureBase64);

        // Sign the AES message
        const aesSignature = await generateSeedSignature(
          wallet,
          AES_SEED_MESSAGE,
        );
        const aesSignatureBase64 = Buffer.from(aesSignature).toString("base64");
        console.log("AES base64 signature:", aesSignatureBase64);

        // Get the token account data
        const tokenAccountInfo =
          await connection.getAccountInfo(tokenAccountPubkey);
        if (!tokenAccountInfo) {
          throw new Error("Token account not found");
        }

        // Parse the token account data to get the mint
        const tokenAccount = unpackAccount(
          tokenAccountPubkey,
          tokenAccountInfo,
          TOKEN_2022_PROGRAM_ID,
        );
        if (!tokenAccount) {
          throw new Error("Failed to parse token account data");
        }

        // Get the mint account data
        const mintAccountInfo = await connection.getAccountInfo(
          tokenAccount.mint,
        );
        if (!mintAccountInfo) {
          throw new Error("Mint account not found");
        }

        // Get the latest blockhash
        const latestBlockhash = await connection.getLatestBlockhash();

        // Step 1: Get the space requirements for each proof account
        console.log("Fetching proof space requirements...");
        const spaceResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/withdraw-cb`,
          {
            method: "GET",
          },
        );

        if (!spaceResponse.ok) {
          throw new Error(
            `HTTP error getting space requirements! Status: ${spaceResponse.status}`,
          );
        }

        const spaceData = await spaceResponse.json();
        console.log("Space requirements:", spaceData);

        // Step 2: Calculate rent for each proof account
        console.log("Calculating rent for proof accounts...");
        const equalityProofRent =
          await connection.getMinimumBalanceForRentExemption(
            spaceData.equality_proof_space,
          );
        const rangeProofRent =
          await connection.getMinimumBalanceForRentExemption(
            spaceData.range_proof_space,
          );

        console.log("Rent requirements:");
        console.log("- Equality proof rent:", equalityProofRent, "lamports");
        console.log("- Range proof rent:", rangeProofRent, "lamports");

        // Add logging to debug
        console.log("Submitting withdraw request with amount:", amount);

        // Step 3: Call the withdraw-cb endpoint with rent information
        console.log("Submitting withdraw request...");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/withdraw-cb`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              elgamal_signature: elGamalSignatureBase64,
              aes_signature: aesSignatureBase64,
              recipient_token_account: Buffer.from(
                tokenAccountInfo.data,
              ).toString("base64"),
              mint_account_info: Buffer.from(mintAccountInfo.data).toString(
                "base64",
              ),
              withdraw_amount_lamports: amount.toString(),
              latest_blockhash: latestBlockhash.blockhash,
              equality_proof_rent: equalityProofRent.toString(),
              range_proof_rent: rangeProofRent.toString(),
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        const { signatures } = await processMultiTransaction(
          data.transactions,
          wallet,
          connection,
          latestBlockhash,
          "Withdraw",
        );

        return {
          signatures,
          ...data,
        };
      } catch (error) {
        console.error("Error processing transaction:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.signatures && data.signatures.length > 0) {
        // Display toast for each signature
        data.signatures.forEach((signature: string) => {
          transactionToast(signature);
        });
        toast.success("Withdraw transaction successful");
      }

      // Hide confidential balance using query cache
      client.setQueryData(
        ["confidential-visibility", tokenAccountPubkey.toString()],
        false,
      );

      // Invalidate relevant queries to refresh data
      return Promise.all([
        client.invalidateQueries({
          queryKey: [
            "get-balance",
            { endpoint: connection.rpcEndpoint, tokenAccountPubkey },
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            "get-signatures",
            { endpoint: connection.rpcEndpoint, tokenAccountPubkey },
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            "get-token-accounts",
            { endpoint: connection.rpcEndpoint, tokenAccountPubkey },
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            "get-token-balance",
            {
              endpoint: connection.rpcEndpoint,
              tokenAccountPubkey: tokenAccountPubkey.toString(),
            },
          ],
        }),
      ]);
    },
    onError: (error) => {
      toast.error(`Withdraw failed! ${error}`);
    },
  });
}

export function useDecryptConfidentialBalance() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confidentialBalance, setConfidentialBalance] = useState<string | null>(
    null,
  );

  const decryptBalance = async (tokenAccountPubkey: PublicKey) => {
    if (!wallet.signMessage || !wallet.publicKey) {
      setError("Wallet connection required");
      return null;
    }

    setError(null);
    setIsDecrypting(true);

    try {
      // Sign the AES message
      const aesSignature = await generateSeedSignature(
        wallet,
        AES_SEED_MESSAGE,
      );
      const aesSignatureBase64 = Buffer.from(aesSignature).toString("base64");
      console.log("AES base64 signature:", aesSignatureBase64);

      // Get the token account data
      const accountInfo = await connection.getAccountInfo(tokenAccountPubkey);
      if (!accountInfo) {
        throw new Error("Token account not found");
      }

      // Call the decrypt-cb endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/decrypt-cb`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            aes_signature: aesSignatureBase64,
            token_account_data: Buffer.from(accountInfo.data).toString(
              "base64",
            ),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Server responded with ${response.status}: ${await response.text()}`,
        );
      }

      const tokenAccountData: Account = unpackAccount(
        tokenAccountPubkey,
        accountInfo,
        TOKEN_2022_PROGRAM_ID,
      );
      const mintAccountData: Mint = await getMint(
        connection,
        tokenAccountData.mint,
        "confirmed",
        TOKEN_2022_PROGRAM_ID,
      );

      const data = await response.json();

      // Convert lamports to UI amount using mint decimals
      // HACK: Use uiAmount from spl-token instead.
      const rawAmount = data.amount;
      const decimals = mintAccountData.decimals;
      const decryptedBalance = (
        parseInt(rawAmount) / Math.pow(10, decimals)
      ).toString();

      setConfidentialBalance(decryptedBalance);
      return decryptedBalance;
    } catch (error) {
      console.error("Decryption failed:", error);
      setError(
        error instanceof Error ? error.message : "Failed to decrypt balance",
      );
      return null;
    } finally {
      setIsDecrypting(false);
    }
  };

  return {
    decryptBalance,
    isDecrypting,
    confidentialBalance,
    error,
    reset: () => {
      setConfidentialBalance(null);
      setError(null);
    },
  };
}
