// types/index.ts
export interface ActivitySummary {
  today: number;
  this_week: number;
  by_action: Record<string, number>;
  top_users: Array<{
    mobile_number: string;
    full_name: string;
    activity_count: number;
  }>;
}

export interface FixedRelation {
  id?: number;
  relation_code: string;
  category: string;
  default_english: string;
  default_tamil: string;
}

export interface Override {
  id: number;
  level: string;
  relation_code: string;
  language: string;
  lifestyle: string;
  familyname8?: string;
  family?: string;
  label: string;
}

export interface ActivityLog {
  id: number;
  action: string;
  relation_code?: string;
  user_mobile: string;
  user_name: string;
  details: Record<string, any>;
  created_at: string;
}
