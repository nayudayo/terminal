import { PublicKey } from '@solana/web3.js';
import { WALLET_ERROR_MESSAGES } from '@/constants/messages';

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateSolanaAddress(address: string): ValidationResult {
  try {
    // Check length
    if (address.length < 32 || address.length > 44) {
      return {
        isValid: false,
        error: WALLET_ERROR_MESSAGES.SOLANA.LENGTH
      };
    }

    // Check characters (base58)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    if (!base58Regex.test(address)) {
      return {
        isValid: false,
        error: WALLET_ERROR_MESSAGES.SOLANA.CHARACTERS
      };
    }

    // Validate as public key
    new PublicKey(address);
    return { isValid: true };

  } catch (error) {
    return {
      isValid: false,
      error: WALLET_ERROR_MESSAGES.SOLANA.FORMAT
    };
  }
}

export function validateNearAddress(address: string): ValidationResult {
  // Check if ends with .near or .testnet
  if (!address.endsWith('.near') && !address.endsWith('.testnet')) {
    return {
      isValid: false,
      error: WALLET_ERROR_MESSAGES.NEAR.ENDING
    };
  }

  // Get username part (remove .near or .testnet)
  const username = address.replace(/\.(near|testnet)$/, '');

  // Check length (2-64 chars)
  if (username.length < 2 || username.length > 64) {
    return {
      isValid: false,
      error: WALLET_ERROR_MESSAGES.NEAR.LENGTH
    };
  }

  // Check characters (lowercase, numbers, hyphens)
  const validChars = /^[a-z0-9-]+$/;
  if (!validChars.test(username)) {
    return {
      isValid: false,
      error: WALLET_ERROR_MESSAGES.NEAR.CHARACTERS
    };
  }

  // Check hyphen rules
  if (username.startsWith('-') || 
      username.endsWith('-') || 
      username.includes('--')) {
    return {
      isValid: false,
      error: WALLET_ERROR_MESSAGES.NEAR.HYPHEN
    };
  }

  return { isValid: true };
}

export function validateWallets(solanaAddress: string, nearAddress: string): ValidationResult {
  // Validate Solana address
  const solanaResult = validateSolanaAddress(solanaAddress);
  if (!solanaResult.isValid) {
    return solanaResult;
  }

  // Validate NEAR address
  const nearResult = validateNearAddress(nearAddress);
  if (!nearResult.isValid) {
    return nearResult;
  }

  return { isValid: true };
}

export function parseWalletCommand(command: string): { 
  solanaAddress: string; 
  nearAddress: string; 
} | null {
  const parts = command.split(' ');
  if (parts.length !== 3 || parts[0] !== 'wallet') {
    return null;
  }

  return {
    solanaAddress: parts[1],
    nearAddress: parts[2]
  };
} 