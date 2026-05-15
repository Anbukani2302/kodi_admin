// src/services/authService.ts
import api from './api';

/* =========================
   TYPES
========================= */

export interface LoginResponse {
  success: boolean;
  message: string;
  refresh: string;
  access: string;
  user: {
    id: number;
    full_name: string;
    email: string;
    mobile_number: string;
    user_type: 'admin' | 'staff';
    is_active: boolean;
    department?: string;
    designation?: string;
    profile_picture?: string;
    admin_id?: string;
  };
}

/* =========================
   LOGIN API (ADMIN + STAFF SAME ENDPOINT)
========================= */

export const loginApi = async (
  full_name: string,
  mobile_number: string,
  email: string,
  password: string,
  role: 'admin' | 'staff' // kept only for compatibility
): Promise<{ data: LoginResponse }> => {
  try {
    // 🔒 FORCE ADMIN LOGIN API
    const url = '/api/admin/auth/login/';

    console.log('Login request to:', url);

    const response = await api.post(url, {
      full_name,
      mobile_number,
      email,
      password,
    });

    console.log('Login response:', response.data);

    // store tokens
    localStorage.setItem('accessToken', response.data.access);
    localStorage.setItem('refreshToken', response.data.refresh);
    localStorage.setItem('user', JSON.stringify(response.data.user));

    return response;
  } catch (error: any) {
    console.error('Login API error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });

    throw error;
  }
};

/* =========================
   TOKEN REFRESH
========================= */

export const refreshTokenApi = async (refreshToken: string) => {
  return api.post('/api/admin/token/refresh/', {
    refresh: refreshToken,
  });
};

/* =========================
   LOGOUT
========================= */

export const logoutApi = async () => {
  const refreshToken = localStorage.getItem('refreshToken');

  try {
    if (refreshToken) {
      await api.post('/api/logout/', {
        refresh: refreshToken,
      });
    }
  } finally {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
};