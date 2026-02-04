import { nanoid } from 'nanoid';
import { ethers } from 'ethers';
import { PAGINATION } from '../config/constants';
import { PaginatedResponse } from '../types';

/**
 * Generates a unique identifier
 * @param prefix - Optional prefix for the ID
 * @param length - Length of the random part (default: 21)
 * @returns Unique identifier
 */
export function generateId(prefix?: string, length: number = 21): string {
  const id = nanoid(length);
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Generates a unique transaction ID
 */
export function generateTransactionId(): string {
  return generateId('txn', 16);
}

/**
 * Generates a unique employee ID
 */
export function generateEmployeeId(): string {
  return generateId('emp', 12);
}

/**
 * Generates a unique organization ID from name
 */
export function generateOrganizationId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

/**
 * Generates a unique channel ID
 */
export function generateChannelId(): string {
  return generateId('ch', 16);
}

/**
 * Formats wei to ether (or smallest unit to standard unit)
 */
export function formatEther(wei: string): string {
  return ethers.formatEther(wei);
}

/**
 * Parses ether to wei (or standard unit to smallest unit)
 */
export function parseEther(ether: string): string {
  return ethers.parseEther(ether).toString();
}

/**
 * Formats USDC (6 decimals) to human-readable format
 */
export function formatUSDC(amount: string): string {
  return (parseInt(amount) / 1e6).toFixed(2);
}

/**
 * Parses USDC from human-readable to 6 decimal format
 */
export function parseUSDC(amount: string): string {
  return (parseFloat(amount) * 1e6).toString();
}

/**
 * Shortens an address for display (0x1234...5678)
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

/**
 * Delays execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retries an async function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      const delayMs = initialDelay * Math.pow(2, attempt - 1);
      await delay(delayMs);
    }
  }
  
  throw lastError!;
}

/**
 * Chunks an array into smaller arrays
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Creates a paginated response
 */
export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  return {
    items,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total
  };
}

/**
 * Calculates pagination offset
 */
export function getPaginationOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

/**
 * Gets safe pagination parameters with defaults
 */
export function getSafePagination(page?: number, pageSize?: number): { page: number; pageSize: number } {
  return {
    page: page && page > 0 ? page : PAGINATION.DEFAULT_PAGE,
    pageSize: pageSize && pageSize > 0 && pageSize <= PAGINATION.MAX_PAGE_SIZE 
      ? pageSize 
      : PAGINATION.DEFAULT_PAGE_SIZE
  };
}

/**
 * Converts string to title case
 */
export function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

/**
 * Checks if a value is empty (null, undefined, empty string, empty array)
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Deep clones an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Removes undefined and null values from an object
 */
export function removeEmpty<T extends object>(obj: T): Partial<T> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined) {
      acc[key as keyof T] = value;
    }
    return acc;
  }, {} as Partial<T>);
}

/**
 * Converts object to query string
 */
export function toQueryString(params: Record<string, any>): string {
  return Object.entries(removeEmpty(params))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

/**
 * Calculates percentage
 */
export function calculatePercentage(part: number, whole: number, decimals: number = 2): number {
  if (whole === 0) return 0;
  return parseFloat(((part / whole) * 100).toFixed(decimals));
}

/**
 * Formats a number with thousand separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Parses boolean from string
 */
export function parseBoolean(value: string | boolean): boolean {
  if (typeof value === 'boolean') return value;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Gets current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Gets Unix timestamp (seconds since epoch)
 */
export function getUnixTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Checks if a date is expired
 */
export function isExpired(expiryDate: Date): boolean {
  return new Date(expiryDate) < new Date();
}

/**
 * Adds days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Adds hours to a date
 */
export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * Truncates a string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Compares two addresses (case-insensitive)
 */
export function addressesEqual(addr1: string, addr2: string): boolean {
  return addr1.toLowerCase() === addr2.toLowerCase();
}

/**
 * Checks if an error is a specific type
 */
export function isErrorOfType(error: any, type: string): boolean {
  return error?.name === type || error?.constructor?.name === type;
}

/**
 * Safely parses JSON with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Creates a random hex string
 */
export function randomHex(length: number = 32): string {
  const crypto = require('crypto');
  const bytes = new Uint8Array(length);
  crypto.randomFillSync(bytes);
  return '0x' + Buffer.from(bytes).toString('hex');
}

export default {
  generateId,
  generateTransactionId,
  generateEmployeeId,
  generateOrganizationId,
  generateChannelId,
  formatEther,
  parseEther,
  formatUSDC,
  parseUSDC,
  shortenAddress,
  delay,
  retry,
  chunkArray,
  createPaginatedResponse,
  getPaginationOffset,
  getSafePagination,
  toTitleCase,
  isEmpty,
  deepClone,
  removeEmpty,
  toQueryString,
  calculatePercentage,
  formatNumber,
  parseBoolean,
  getCurrentTimestamp,
  getUnixTimestamp,
  isExpired,
  addDays,
  addHours,
  truncate,
  addressesEqual,
  isErrorOfType,
  safeJsonParse,
  randomHex
};
