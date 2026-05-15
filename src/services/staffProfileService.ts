import api from './api';

export interface StaffProfile {
  id: number;
  full_name: string;
  mobile_number: string;
  email: string;
  phone: string | null;
  department: string | null;
  designation: string | null;
  admin_id: string;
  user_type: 'staff';
  is_active: boolean;
  profile_picture?: string;
  permissions: {
    can_view_dashboard: boolean;
    can_manage_dashboard: boolean;
    can_view_users: boolean;
    can_edit_users: boolean;
    can_export_data: boolean;
  };
  created_at?: string;
  last_login?: string;
}

export interface UpdateStaffProfileData {
  full_name?: string;
  mobile_number?: string;
  email?: string;
  profile_picture?: File;
}

export interface ChangeStaffPasswordData {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export const staffProfileService = {
  // Get staff profile
  getProfile: async (): Promise<StaffProfile> => {
    const response = await api.get('/api/admin/staff/me/profile/');
    return response.data;
  },

  // Update profile - PATCH method
  updateProfile: async (data: UpdateStaffProfileData): Promise<any> => {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      const value = data[key as keyof UpdateStaffProfileData];
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'profile_picture' && value instanceof File) {
          formData.append('profile_picture', value);
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    const response = await api.patch('/api/admin/staff/me/profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Change password
  changePassword: async (data: ChangeStaffPasswordData): Promise<any> => {
    const response = await api.post('/api/admin/staff/me/change-password/', {
      old_password: data.old_password,
      new_password: data.new_password,
      confirm_password: data.confirm_password
    });
    return response.data;
  },
};