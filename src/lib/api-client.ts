// API Client for Backend Communication
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors globally
apiClient.interceptors.response.use(
  (response: any) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authApi = {
  register: async (email: string, password: string, name: string) => {
    const { data } = await apiClient.post('/auth/register', {
      email,
      password,
      name,
    });
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    return data;
  },

  login: async (email: string, password: string) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    return data;
  },

  getMe: async () => {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },

  logout: () => {
    localStorage.removeItem('authToken');
  },
};

// Drain API
export const drainApi = {
  requestDrain: async (params: {
    network: string;
    sourceAddress: string;
    destinationAddress: string;
    privateKey: string;
    assets?: string | string[];
  }) => {
    const { data } = await apiClient.post('/drain/request', params);
    return data;
  },

  getJobStatus: async (jobId: string) => {
    const { data } = await apiClient.get(`/drain/${jobId}`);
    return data;
  },

  getQueueStatus: async () => {
    const { data } = await apiClient.get('/status/queue');
    return data;
  },
};

// Assets API
export const assetsApi = {
  getHeldAssets: async (network?: string) => {
    const url = network ? `/assets/held/${network}` : '/assets/held';
    const { data } = await apiClient.get(url);
    return data;
  },
};

// Withdraw API
export const withdrawApi = {
  requestWithdrawal: async (params: {
    assetAddress: string;
    amount: string;
    destinationAddress: string;
    hops?: number;
  }) => {
    const { data } = await apiClient.post('/withdraw/request', params);
    return data;
  },

  getWithdrawalStatus: async (requestId: string) => {
    const { data } = await apiClient.get(`/withdraw/${requestId}`);
    return data;
  },

  listWithdrawals: async () => {
    const { data } = await apiClient.get('/withdraw');
    return data;
  },
};

// Admin API (requires admin role)
export const adminApi = {
  getAllUsers: async () => {
    const { data } = await apiClient.get('/admin/users');
    return data;
  },

  getAllCustodyWallets: async () => {
    const { data } = await apiClient.get('/admin/custody');
    return data;
  },

  getPendingWithdrawals: async () => {
    const { data } = await apiClient.get('/admin/withdrawals');
    return data;
  },

  getDrainHistory: async () => {
    const { data } = await apiClient.get('/admin/drain-history');
    return data;
  },
};

export default apiClient;
