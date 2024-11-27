import { Connection, PublicKey } from '@solana/web3.js';
import { connect, keyStores } from 'near-api-js';
import { SHA256 } from 'crypto-js';
import { WALLET_ERROR_MESSAGES } from '@/constants/messages';

// Interfaces
interface WalletValidationResult {
  isValid: boolean;
  error?: string;
  transactionCount?: number;
  solanaWallet?: string;
  nearWallet?: string;
  solanaHash?: string;
  nearHash?: string;
}

interface ParsedWallets {
  solanaAddress: string;
  solanaHash: string;
  nearAddress: string;
  nearHash: string;
}

interface TransactionVerification {
  isValid: boolean;
  hash?: string;
  error?: string;
}

// Rate limiting
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; timestamp: number }>();

// Connections
const solanaConnection = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
);

const nearConfig = {
  networkId: 'mainnet',
  nodeUrl: 'https://rpc.mainnet.near.org',
  walletUrl: 'https://wallet.near.org',
  helperUrl: 'https://helper.mainnet.near.org',
  explorerUrl: 'https://explorer.mainnet.near.org',
  keyStore: new keyStores.InMemoryKeyStore()
};

// Basic format validation
export const isValidBase58 = (str: string): boolean => {
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  return base58Regex.test(str);
};

export const isValidNearAddress = (str: string): boolean => {
  if (!str.endsWith('.near') && !str.endsWith('.testnet')) return false;
  const username = str.replace(/\.(near|testnet)$/, '');
  if (username.length < 2 || username.length > 64) return false;
  const validUsernameRegex = /^(?!-)[a-z0-9-]+(?<!-)$/;
  if (!validUsernameRegex.test(username)) return false;
  if (username.includes('--')) return false;
  return true;
};

// Rate limiting
export const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const userAttempts = attempts.get(userId);

  if (!userAttempts) {
    attempts.set(userId, { count: 1, timestamp: now });
    return true;
  }

  if (now - userAttempts.timestamp > RATE_LIMIT_WINDOW) {
    attempts.set(userId, { count: 1, timestamp: now });
    return true;
  }

  if (userAttempts.count >= MAX_ATTEMPTS) {
    return false;
  }

  attempts.set(userId, { 
    count: userAttempts.count + 1, 
    timestamp: userAttempts.timestamp 
  });
  return true;
};

// Full validation functions
export async function validateSolanaAddress(address: string): Promise<WalletValidationResult> {
  try {
    if (!isValidBase58(address) || address.length < 32 || address.length > 44) {
      return { isValid: false, error: WALLET_ERROR_MESSAGES.SOLANA.FORMAT };
    }

    const pubKey = new PublicKey(address);
    const signatures = await solanaConnection.getSignaturesForAddress(pubKey, { limit: 10 });
    const transactionCount = signatures.length;

    if (transactionCount === 0) {
      return { 
        isValid: false, 
        error: WALLET_ERROR_MESSAGES.SOLANA.NO_TRANSACTIONS,
        transactionCount: 0
      };
    }

    return { 
      isValid: true,
      transactionCount,
      solanaWallet: address
    };
  } catch (error) {
    console.error('Solana validation error:', error);
    return { isValid: false, error: WALLET_ERROR_MESSAGES.SOLANA.FORMAT };
  }
}

export async function validateNearAddress(address: string): Promise<WalletValidationResult> {
  try {
    // Check if ends with .near or .testnet
    if (!address.endsWith('.near') && !address.endsWith('.testnet')) {
      return { isValid: false, error: WALLET_ERROR_MESSAGES.NEAR.ENDING };
    }

    // Get username part
    const username = address.split('.')[0];

    // Check length
    if (username.length < 2 || username.length > 64) {
      return { isValid: false, error: WALLET_ERROR_MESSAGES.NEAR.LENGTH };
    }

    // Check characters
    const validChars = /^[a-z0-9-]+$/;
    if (!validChars.test(username)) {
      return { isValid: false, error: WALLET_ERROR_MESSAGES.NEAR.CHARACTERS };
    }

    // Check hyphen rules
    if (username.startsWith('-') || username.endsWith('-') || username.includes('--')) {
      return { isValid: false, error: WALLET_ERROR_MESSAGES.NEAR.HYPHEN };
    }

    // Connect to NEAR
    const near = await connect(nearConfig);
    
    try {
      // Try to get account
      const account = await near.account(address);
      const state = await account.state();
      
      // Check if account exists and has any transactions
      if (!state || state.amount === '0') {
        return { 
          isValid: false, 
          error: 'No transactions found. Please use a wallet with transaction history.' 
        };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Account not found or invalid' };
    }
  } catch (error) {
    console.error('NEAR validation error:', error);
    return { isValid: false, error: WALLET_ERROR_MESSAGES.NEAR.FORMAT };
  }
}

export function parseWalletCommand(message: string): ParsedWallets | null {
  const parts = message.split(' ');
  if (parts.length !== 5) return null;

  return {
    solanaAddress: parts[1],
    solanaHash: parts[2],
    nearAddress: parts[3],
    nearHash: parts[4]
  };
}

export async function verifyWalletTransaction(address: string, network: 'solana' | 'near'): Promise<boolean> {
  try {
    if (network === 'solana') {
      const result = await validateSolanaAddress(address);
      return result.isValid && (result.transactionCount || 0) > 0;
    } else {
      const result = await validateNearAddress(address);
      return result.isValid;
    }
  } catch (error) {
    console.error(`${network} transaction verification error:`, error);
    return false;
  }
}

export async function verifyTransactionHash(
  walletAddress: string,
  providedHash: string,
  network: 'solana' | 'near'
): Promise<TransactionVerification> {
  try {
    if (network === 'solana') {
      const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
      const pubKey = new PublicKey(walletAddress);
      
      // Verify the provided hash exists in recent transactions
      const transactions = await connection.getSignaturesForAddress(pubKey, { limit: 10 });
      const hashExists = transactions.some(tx => tx.signature === providedHash);
      
      if (!hashExists) {
        return {
          isValid: false,
          error: 'Provided transaction hash not found in recent transactions'
        };
      }

      return {
        isValid: true,
        hash: providedHash
      };

    } else if (network === 'near') {
      // Verify NEAR transaction hash
      const response = await fetch(`${process.env.NEAR_RPC_URL}/tx/${providedHash}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'verification',
          method: 'tx',
          params: [providedHash, walletAddress]
        })
      });

      const data = await response.json();
      
      if (!data.result) {
        return {
          isValid: false,
          error: 'Provided transaction hash not found or invalid'
        };
      }

      return {
        isValid: true,
        hash: providedHash
      };
    }

    return {
      isValid: false,
      error: 'Unsupported network'
    };

  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Transaction verification failed'
    };
  }
} 