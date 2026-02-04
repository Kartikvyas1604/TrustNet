/**
 * Validation Utilities for TrustNet
 * 
 * Provides validation functions for addresses, transactions, and user inputs.
 */

import { ethers } from 'ethers';
import { SUPPORTED_CHAINS, SUPPORTED_CURRENCIES } from '../config/constants';

/**
 * Validates Ethereum-compatible address
 */
export function isValidEthereumAddress(address: string): boolean {
  return ethers.isAddress(address);
}

/**
 * Validates Sui address format
 */
export function isValidSuiAddress(address: string): boolean {
  // Sui addresses are 64-character hex strings starting with 0x
  const suiAddressRegex = /^0x[a-fA-F0-9]{64}$/;
  return suiAddressRegex.test(address);
}

/**
 * Validates address based on chain
 */
export function isValidAddress(address: string, chain: string): boolean {
  switch (chain.toLowerCase()) {
    case 'ethereum':
    case 'base':
    case 'polygon':
    case 'arbitrum':
    case 'arc':
      return isValidEthereumAddress(address);
    case 'sui':
      return isValidSuiAddress(address);
    default:
      return false;
  }
}

/**
 * Validates ENS name format
 */
export function isValidENSName(name: string): boolean {
  // ENS names must end with .eth and contain valid characters
  const ensRegex = /^[a-z0-9-]+\.eth$/;
  return ensRegex.test(name.toLowerCase());
}

/**
 * Validates transaction amount
 */
export function isValidAmount(amount: string): boolean {
  try {
    const num = parseFloat(amount);
    return num > 0 && !isNaN(num) && isFinite(num);
  } catch {
    return false;
  }
}

/**
 * Validates currency is supported
 */
export function isValidCurrency(currency: string): boolean {
  return SUPPORTED_CURRENCIES.includes(currency as any);
}

/**
 * Validates chain is supported
 */
export function isValidChain(chain: string): boolean {
  return SUPPORTED_CHAINS.includes(chain.toLowerCase());
}

/**
 * Validates organization ID format
 */
export function isValidOrganizationId(orgId: string): boolean {
  // Organization ID: lowercase alphanumeric with hyphens, 3-50 characters
  const orgIdRegex = /^[a-z0-9-]{3,50}$/;
  return orgIdRegex.test(orgId);
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates phone number (international format)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

/**
 * Validates country code (ISO 3166-1 alpha-2)
 */
export function isValidCountryCode(code: string): boolean {
  const countryCodeRegex = /^[A-Z]{2}$/;
  return countryCodeRegex.test(code);
}

/**
 * Validates URL format
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates IPFS hash (CIDv0 or CIDv1)
 */
export function isValidIPFSHash(hash: string): boolean {
  // CIDv0: Qm... (46 characters)
  const cidv0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  // CIDv1: b... (variable length)
  const cidv1Regex = /^b[A-Za-z2-7]{58}$/;
  return cidv0Regex.test(hash) || cidv1Regex.test(hash);
}

/**
 * Validates transaction hash for Ethereum-compatible chains
 */
export function isValidEthTxHash(hash: string): boolean {
  const txHashRegex = /^0x[a-fA-F0-9]{64}$/;
  return txHashRegex.test(hash);
}

/**
 * Validates transaction hash for Sui
 */
export function isValidSuiTxHash(hash: string): boolean {
  // Sui transaction digests are base64 encoded
  const suiTxRegex = /^[A-Za-z0-9+/=]{44}$/;
  return suiTxRegex.test(hash);
}

/**
 * Sanitizes string input to prevent injection attacks
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Validates pagination parameters
 */
export function validatePagination(page: number, pageSize: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(page) || page < 1) {
    return { valid: false, error: 'Page must be a positive integer' };
  }
  
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    return { valid: false, error: 'Page size must be between 1 and 100' };
  }
  
  return { valid: true };
}

/**
 * Validates date range
 */
export function validateDateRange(startDate: Date, endDate: Date): { valid: boolean; error?: string } {
  if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
    return { valid: false, error: 'Invalid start date' };
  }
  
  if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
    return { valid: false, error: 'Invalid end date' };
  }
  
  if (startDate > endDate) {
    return { valid: false, error: 'Start date must be before end date' };
  }
  
  return { valid: true };
}

/**
 * Checks if string contains only alphanumeric characters and hyphens
 */
export function isAlphanumericWithHyphens(str: string): boolean {
  return /^[a-zA-Z0-9-]+$/.test(str);
}

/**
 * Validates JWT token format (without verification)
 */
export function isValidJWTFormat(token: string): boolean {
  const parts = token.split('.');
  return parts.length === 3;
}

/**
 * Validates signature format (hex string)
 */
export function isValidSignature(signature: string): boolean {
  const signatureRegex = /^0x[a-fA-F0-9]{130}$/;
  return signatureRegex.test(signature);
}

export default {
  isValidEthereumAddress,
  isValidSuiAddress,
  isValidAddress,
  isValidENSName,
  isValidAmount,
  isValidCurrency,
  isValidChain,
  isValidOrganizationId,
  isValidEmail,
  isValidPhoneNumber,
  isValidCountryCode,
  isValidURL,
  isValidIPFSHash,
  isValidEthTxHash,
  isValidSuiTxHash,
  sanitizeString,
  validatePagination,
  validateDateRange,
  isAlphanumericWithHyphens,
  isValidJWTFormat,
  isValidSignature
};
