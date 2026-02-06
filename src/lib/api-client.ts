// API Client for TrustNet Backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5001';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface OnboardEmployeeRequest {
  authKey: string;
  walletAddress: string;
  signature: string;
  chain: string;
  profileData?: {
    nickname?: string;
    avatar?: string;
    email?: string;
    phoneNumber?: string;
  };
}

export interface CreateTransactionRequest {
  fromEmployeeId: string;
  toEmployeeId?: string;
  toAddress?: string;
  toEnsName?: string;
  amount: string;
  currency: string;
  chain?: string;
  privacyLevel?: 'PUBLIC' | 'ORGANIZATION_ONLY' | 'FULLY_PRIVATE';
  memo?: string;
}

export interface TransactionResponse {
  transactionId: string;
  status: string;
  blockchainTxHash?: string;
  estimatedTime?: number;
}

export interface EmployeeResponse {
  id: string;
  employeeId: string;
  organizationId: string;
  walletAddresses: Record<string, string>;
  ensName?: string;
  profileData?: any;
  status: string;
}

class ApiClient {
  private baseUrl: string;
  private wsUrl: string;

  constructor() {
    this.baseUrl = API_URL;
    this.wsUrl = WS_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'Request failed',
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Organization endpoints
  async registerOrganization(data: {
    name: string;
    registrationNumber: string;
    country: string;
    adminWallets: string[];
    kycDocuments?: string[];
  }): Promise<ApiResponse> {
    return this.request('/api/organizations/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrganization(organizationId: string): Promise<ApiResponse> {
    return this.request(`/api/organizations/${organizationId}`, {
      method: 'GET',
    });
  }

  // Employee endpoints
  async onboardEmployee(data: OnboardEmployeeRequest): Promise<ApiResponse<EmployeeResponse>> {
    return this.request('/api/employees/onboard', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getEmployee(employeeId: string): Promise<ApiResponse<EmployeeResponse>> {
    return this.request(`/api/employees/${employeeId}`, {
      method: 'GET',
    });
  }

  async getOrganizationEmployees(organizationId: string): Promise<ApiResponse<EmployeeResponse[]>> {
    return this.request(`/api/employees/organization/${organizationId}`, {
      method: 'GET',
    });
  }

  async addWalletToEmployee(
    employeeId: string,
    data: { chain: string; walletAddress: string }
  ): Promise<ApiResponse> {
    return this.request(`/api/employees/${employeeId}/wallet`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Transaction endpoints
  async createTransaction(data: CreateTransactionRequest): Promise<ApiResponse<TransactionResponse>> {
    return this.request('/api/transactions/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTransaction(transactionId: string): Promise<ApiResponse> {
    return this.request(`/api/transactions/${transactionId}`, {
      method: 'GET',
    });
  }

  async getEmployeeTransactions(
    employeeId: string,
    params?: {
      status?: string;
      type?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<ApiResponse> {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request(`/api/transactions/employee/${employeeId}?${queryParams}`, {
      method: 'GET',
    });
  }

  async getOrganizationTransactions(
    organizationId: string,
    params?: {
      status?: string;
      type?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<ApiResponse> {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request(`/api/transactions/organization/${organizationId}?${queryParams}`, {
      method: 'GET',
    });
  }

  // ENS endpoints
  async registerENS(data: {
    employeeId: string;
    ensName: string;
  }): Promise<ApiResponse> {
    return this.request('/api/ens/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resolveENS(ensName: string): Promise<ApiResponse> {
    return this.request(`/api/ens/resolve/${ensName}`, {
      method: 'GET',
    });
  }

  // Auth key endpoints
  async generateAuthKey(organizationId: string, data: {
    count?: number;
    expiresInDays?: number;
    metadata?: any;
  }): Promise<ApiResponse> {
    return this.request(`/api/organizations/${organizationId}/auth-keys/generate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAuthKeys(organizationId: string): Promise<ApiResponse> {
    return this.request(`/api/organizations/${organizationId}/auth-keys`, {
      method: 'GET',
    });
  }

  // Health check
  async health(): Promise<ApiResponse> {
    return this.request('/health', {
      method: 'GET',
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types
export type { ApiClient };
