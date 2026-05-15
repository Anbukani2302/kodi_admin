import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import { loginApi, logoutApi } from '../services/authService';
import api from '../services/api';

type Role = 'admin' | 'staff' | null;

interface User {
  id: number;
  full_name: string;
  email: string;
  mobile_number: string;
  admin_id?: string;
  role?: 'admin' | 'staff';
  user_type?: 'admin' | 'staff';
  is_active: boolean;
  department?: string;
  designation?: string;
  profile_picture?: string;
  permissions?: {
    can_view_users?: boolean;
    view_users?: boolean;
    user_management?: boolean;
    can_manage_post?: boolean;
    manage_post?: boolean;
    post_management?: boolean;
    can_manage_posts?: boolean;
    posts_management?: boolean;
    post?: boolean;
    can_manage_chat?: boolean;
    manage_chat?: boolean;
    chat_management?: boolean;
    can_manage_chats?: boolean;
    chats_management?: boolean;
    chat?: boolean;
    can_manage_event?: boolean;
    manage_event?: boolean;
    event_management?: boolean;
    can_manage_events?: boolean;
    events_management?: boolean;
    event?: boolean;
    can_manage_fixed_relations?: boolean;
    manage_fixed_relations?: boolean;
    can_manage_family_overrides?: boolean;
    manage_family_overrides?: boolean;
    family_management?: boolean;
    can_manage_relations?: boolean;
    relation_management?: boolean;
    family_overrides?: boolean;
    profile_overrides?: boolean;
    can_manage_language_lifestyle?: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  role: Role;
  login: (
    full_name: string,
    mobile_number: string,
    email: string,
    password: string,
    role: 'admin' | 'staff'
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Token validation and refresh
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (e) {
      return true; // If token is invalid, consider it expired
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/api/token/refresh/', {
        refresh: refreshToken,
      });

      const newAccessToken = response.data.access;
      localStorage.setItem('accessToken', newAccessToken);

      // Update API instance header
      api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout(); // Clear all tokens on refresh failure
      return false;
    }
  };

  // Check if user is already logged in on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          // Check if token is expired
          if (isTokenExpired(token)) {
            console.log('Token expired, attempting refresh...');
            const refreshSuccess = await refreshToken();
            if (!refreshSuccess) {
              setLoading(false);
              return;
            }
          }

          // Parse and set user data
          const parsedUser = JSON.parse(userData);
          
          // If user is staff, fetch their permissions
          if (parsedUser.user_type === 'staff' && parsedUser.staff_id) {
            try {
              const permissionsResponse = await api.get(`/api/admin/staff/${parsedUser.staff_id}/permissions/`);
              parsedUser.permissions = permissionsResponse.data.permissions;
              console.log('AuthContext - Loaded staff permissions:', permissionsResponse.data.permissions);
            } catch (error) {
              console.error('Failed to fetch staff permissions:', error);
            }
          }
          
          setUser(parsedUser);

          // Ensure API has the latest token
          api.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;

        } catch (e) {
          console.error('Failed to initialize auth:', e);
          await logout(); // Clear corrupted data
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (
    full_name: string,
    mobile_number: string,
    email: string,
    password: string,
    role: 'admin' | 'staff'
  ) => {
    try {
      const res = await loginApi(
        full_name,
        mobile_number,
        email,
        password,
        role
      );

      if (res.data.success) {
        localStorage.setItem('accessToken', res.data.access);
        localStorage.setItem('refreshToken', res.data.refresh);
        localStorage.setItem('user', JSON.stringify(res.data.user));

        setUser(res.data.user);
      } else {
        throw new Error(res.data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response) {
        throw new Error(error.response.data.message || 'Login failed');
      } else if (error.request) {
        throw new Error('Unable to connect to server');
      } else {
        throw new Error('An error occurred');
      }
    }
  };

  const logout = async () => {
    try {
      // Call logout API to invalidate refresh token on server
      await logoutApi();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Always clear local storage regardless of API success
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      
      // Clear API default header
      delete api.defaults.headers.common['Authorization'];
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || user?.user_type || null,
        login,
        logout,
        refreshToken,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}