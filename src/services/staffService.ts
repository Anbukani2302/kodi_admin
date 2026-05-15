import api from './api';


export interface Staff {
  id: number;
  mobile_number: string;
  email: string;
  full_name: string;
  name?: string; // Alternative field name
  is_active: boolean;
  staff_is_active: boolean;
  is_mobile_verified: boolean;
  created_at: string;
  last_login: string | null;
  user_type: 'staff';
  admin_id?: string;
}

export interface CreateStaffRequest {
  full_name: string;
  mobile_number: string;
  email: string;
  password: string;
}

export interface UpdateStaffRequest {
  full_name?: string;
  mobile_number?: string;
  email?: string;
  password?: string;
}

export interface StaffResponse {
  success: boolean;
  message: string;
  staff?: Staff;
}

export interface ToggleStatusResponse {
  success: boolean;
  message: string;
  staff: {
    full_name: string;
    mobile_number: string;
    email: string;
    is_active: boolean;
    staff_is_active: boolean;
  };
}

export interface DeleteStaffResponse {
  success: boolean;
  message: string;
}

export const staffService = {
  // Get all staff with optional filters
  getAllStaff: async (search?: string, status?: string, page: number = 1, pageSize: number = 10): Promise<any> => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status && status !== 'all') params.append('status', status);
      params.append('page', page.toString());
      params.append('page_size', pageSize.toString());

      // Add timestamp to prevent caching
      params.append('_t', new Date().getTime().toString());

      const response = await api.get(`/api/admin/staff/`, { params });

      // Log the full response for debugging
      console.log('API Response Status:', response.status);
      console.log('API Response Data:', response.data);

      return response.data;
    } catch (error) {
      console.error('Error fetching staff:', error);
      throw error;
    }
  },

  // Get single staff by ID
  getStaffById: async (id: number): Promise<Staff> => {
    try {
      const response = await api.get(`/api/admin/staff/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching staff by ID:', error);
      throw error;
    }
  },

  // Create new staff
  createStaff: async (staffData: CreateStaffRequest): Promise<StaffResponse> => {
    try {
      const response = await api.post('/api/admin/staff/', staffData);
      return response.data;
    } catch (error) {
      console.error('Error creating staff:', error);
      throw error;
    }
  },

  // Update staff
  updateStaff: async (id: number, staffData: UpdateStaffRequest): Promise<StaffResponse> => {
    try {
      const response = await api.put(`/api/admin/staff/${id}/`, staffData);
      return response.data;
    } catch (error) {
      console.error('Error updating staff:', error);
      throw error;
    }
  },

  // Partial update staff (PATCH)
  patchStaff: async (id: number, staffData: Partial<UpdateStaffRequest>): Promise<StaffResponse> => {
    try {
      const response = await api.patch(`/api/admin/staff/${id}/`, staffData);
      return response.data;
    } catch (error) {
      console.error('Error patching staff:', error);
      throw error;
    }
  },

  // Toggle staff active status
  toggleStaffStatus: async (id: number): Promise<ToggleStatusResponse> => {
    try {
      const response = await api.post(`/api/admin/staff/${id}/toggle_active/`);
      return response.data;
    } catch (error) {
      console.error('Error toggling staff status:', error);
      throw error;
    }
  },

  // Delete staff
  deleteStaff: async (id: number): Promise<DeleteStaffResponse> => {
    try {
      const response = await api.delete(`/api/admin/staff/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting staff:', error);
      throw error;
    }
  },

  // Test API connection
  testConnection: async (): Promise<boolean> => {
    try {
      const response = await api.get('/api/admin/staff/', {
        params: { _t: new Date().getTime().toString(), page: 1, page_size: 1 }
      });
      return response.status === 200;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
};

export default api;