import api from "./api";

export interface User {
  id: number;
  mobile_number: string;
  email: string;
  is_active: boolean;
  is_mobile_verified: boolean;
  created_at: string;
  last_login: string;
  name: string;
  user_type?: "regular" | "admin" | "staff";
}

export interface UserProfile {
  id: number;
  mobile_number: string;
  email: string;
  is_active: boolean;
  is_mobile_verified: boolean;
  created_at: string;
  last_login: string;
  name: string;
  profile_info: {
    firstname: string;
    secondname: string;
    thirdname: string;
    gender: string;
    dateofbirth: string;
    age: number;
    lifestyle: string;
    familyname8: string;
    present_city: string;
    state: string;
    nationality: string;
    preferred_language: string;
  };
  user_type: "regular" | "admin" | "staff";
  is_admin_staff: boolean;
  profile_completion: number;
}

export interface UserStats {
  total_users: number;
  admin_count: number;
  staff_count: number;
  regular_users: number;
  active_users: number;
  today_new_users: number;
  week_new_users: number;
  timestamp: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

export const userService = {
  // Get all users with optional filters
  getUsers: async (params?: {
    status?: string;
    search?: string;
  }): Promise<User[]> => {
    const queryParams = new URLSearchParams();
    if (params?.status && params.status !== "all") {
      queryParams.append("status", params.status);
    }
    if (params?.search) {
      queryParams.append("search", params.search);
    }

    const url = `/api/admin/users/${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    const response = await api.get(url);
    return response.data;
  },

  // Get user statistics
  getStats: async (): Promise<UserStats> => {
    const response = await api.get("/api/admin/users/stats/");
    return response.data;
  },

  // Get single user profile
  getUserProfile: async (userId: number): Promise<UserProfile> => {
    const response = await api.get(`/api/admin/users/${userId}/`);
    return response.data;
  },

  // Activate user
  activateUser: async (userId: number): Promise<ApiResponse> => {
    const response = await api.post(`/api/admin/users/${userId}/activate/`);
    return response.data;
  },

  // Deactivate user
  deactivateUser: async (userId: number): Promise<ApiResponse> => {
    const response = await api.post(`/api/admin/users/${userId}/deactivate/`);
    return response.data;
  },

  // Bulk activate users
  bulkActivateUsers: async (userIds: number[]): Promise<ApiResponse[]> => {
    const promises = userIds.map((userId) => userService.activateUser(userId));
    return Promise.all(promises);
  },

  // Bulk deactivate users
  bulkDeactivateUsers: async (userIds: number[]): Promise<ApiResponse[]> => {
    const promises = userIds.map((userId) =>
      userService.deactivateUser(userId)
    );
    return Promise.all(promises);
  },
};
