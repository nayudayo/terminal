import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';

interface TransactionVerificationResult {
  isVerified: boolean;
  error?: string;
}

interface NearTransaction {
  receiver_id: string;
  status: string;
  transaction_hash: string;
}

// Solana transaction verification
export const verifySolanaTransaction = async (
  walletAddress: string,
  destinationAddress: string
): Promise<TransactionVerificationResult> => {
  try {
    const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
    const publicKey = new PublicKey(walletAddress);
    
    // Get recent transactions
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 10 });
    
    // Check if any transaction was made to the destination address
    for (const sig of signatures) {
      const tx = await connection.getParsedTransaction(sig.signature) as ParsedTransactionWithMeta;
      const destPubKey = new PublicKey(destinationAddress);
      
      if (tx?.transaction.message.accountKeys.some(key => 
        key instanceof PublicKey && key.equals(destPubKey)
      )) {
        return { isVerified: true };
      }
    }

    return {
      isVerified: false,
      error: 'No transaction found to the required destination address'
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to verify Solana transaction';
    return {
      isVerified: false,
      error: errorMessage
    };
  }
};

// NEAR transaction verification
export const verifyNearTransaction = async (
  walletAddress: string,
  destinationAddress: string
): Promise<TransactionVerificationResult> => {
  try {
    const config = {
      networkId: 'mainnet',
      nodeUrl: process.env.NEAR_NODE_URL || 'https://rpc.mainnet.near.org',
    };

    // Use NEAR RPC directly
    const response = await fetch(config.nodeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'EXPERIMENTAL_tx_status',
        params: [walletAddress, destinationAddress],
      }),
    });

    const data = await response.json();
    const transactions = data.result?.transactions as NearTransaction[];

    // Check if any transaction was made to the destination address
    const hasTransaction = transactions?.some((tx: NearTransaction) => 
      tx.receiver_id === destinationAddress && tx.status === 'SUCCESS'
    );

    if (hasTransaction) {
      return { isVerified: true };
    }

    return {
      isVerified: false,
      error: 'No transaction found to the required destination address'
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to verify NEAR transaction';
    return {
      isVerified: false,
      error: errorMessage
    };
  }
};

// Combined verification
export const verifyWalletTransactions = async (
  solanaWallet: string,
  nearWallet: string,
  solanaDestination: string,
  nearDestination: string
): Promise<TransactionVerificationResult> => {
  try {
    // Verify both transactions
    const [solanaResult, nearResult] = await Promise.all([
      verifySolanaTransaction(solanaWallet, solanaDestination),
      verifyNearTransaction(nearWallet, nearDestination)
    ]);

    // Both must be verified
    if (!solanaResult.isVerified) {
      return solanaResult;
    }

    if (!nearResult.isVerified) {
      return nearResult;
    }

    return { isVerified: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to verify transactions';
    return {
      isVerified: false,
      error: errorMessage
    };
  }
}; 