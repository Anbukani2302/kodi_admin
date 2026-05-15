  import api from './api';

  export interface AdminProfile {
    full_name: string;
    mobile_number: string;
    email: string;
    admin_id: string;
    phone: string;
    department: string;
    designation: string;
    profile_picture: string;
    user_type: 'admin' | 'staff';
    is_active: boolean;
    created_at: string;
    last_login: string;
  }

  export interface UpdateProfileData {
    full_name?: string;
    mobile_number?: string;
    email?: string;
    phone?: string;
    department?: string;
    designation?: string;
    profile_picture?: File;
  }

  export interface ChangePasswordData {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }

  export const profileService = {
    // Get admin profile
    getProfile: async (): Promise<AdminProfile> => {
      const response = await api.get('/api/admin/profile/');
      return response.data;
    },

    // Update profile
    updateProfile: async (data: UpdateProfileData): Promise<any> => {
      const formData = new FormData();
      
      Object.keys(data).forEach(key => {
        const value = data[key as keyof UpdateProfileData];
        if (value !== undefined && value !== null) {
          if (key === 'profile_picture' && value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      const response = await api.put('/api/admin/profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },

    // Change password
    changePassword: async (data: ChangePasswordData): Promise<any> => {
      const response = await api.post('/api/admin/change-password/', data);
      return response.data;
    },
  };