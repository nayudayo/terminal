// Wallet validation utilities
export const isValidBase58 = (str: string): boolean => {
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  return base58Regex.test(str);
};

export const isValidNearAddress = (str: string): boolean => {
  // Check if ends with .near or .testnet
  if (!str.endsWith('.near') && !str.endsWith('.testnet')) return false;

  // Get username part (remove .near or .testnet)
  const username = str.replace(/\.(near|testnet)$/, '');

  // Check username length (2-64 chars)
  if (username.length < 2 || username.length > 64) return false;

  // Check for valid characters and hyphen rules
  const validUsernameRegex = /^(?!-)[a-z0-9-]+(?<!-)$/;
  if (!validUsernameRegex.test(username)) return false;

  // Check for consecutive hyphens
  if (username.includes('--')) return false;

  return true;
};

// Update the return type to handle both wallets
export interface WalletValidationResult {
  isValid: boolean;
  solanaWallet?: string;
  nearWallet?: string;
  error?: string;
}

// Update the main validation function to handle both wallets
export const validateWalletAddress = (input: string): WalletValidationResult => {
  // Split input into two parts (expecting "wallet <solana> <near>")
  const parts = input.split(' ');
  if (parts.length !== 2) {
    return {
      isValid: false,
      error: 'Both Solana and NEAR wallets are required. Format: "wallet <solana-address> <near-address>"'
    };
  }

  const [solanaAddress, nearAddress] = parts;

  // Validate Solana address
  if (!solanaAddress || solanaAddress.length < 32 || solanaAddress.length > 44 || !isValidBase58(solanaAddress)) {
    return {
      isValid: false,
      error: 'Invalid Solana wallet format. Must be a valid base58-encoded address (32-44 characters)'
    };
  }

  // Validate NEAR address
  if (!nearAddress || !isValidNearAddress(nearAddress)) {
    return {
      isValid: false,
      error: 'Invalid NEAR wallet format. Must be a valid username ending in .near or .testnet'
    };
  }

  // Both are valid
  return {
    isValid: true,
    solanaWallet: solanaAddress,
    nearWallet: nearAddress
  };
};

// Add rate limiting
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; timestamp: number }>();

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