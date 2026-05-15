// types/staff.ts
export interface Staff {
  id: number;
  mobile_number: string;
  email: string;
  is_active: boolean;
  is_mobile_verified: boolean;
  created_at: string;
  last_login: string | null;
  name: string; // The user specified "name" in the list response
  full_name?: string; // The user specified "full_name" in create response
  admin_id?: string;
  user_type?: string;
}

export interface CreateStaffRequest {
  full_name: string;
  mobile_number: string;
  email: string;
  password: string;
}

export interface CreateStaffResponse {
  success: boolean;
  message: string;
  staff: Staff;
}

export interface ToggleStatusResponse {
  success: boolean;
  message: string;
  staff: Staff;
}