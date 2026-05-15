// D:\KODI Genealogy Admin Dashboard\src\services\relationApi.ts
import api from "./api";

// Types
export interface FixedRelation {
  id: number;
  relation_code: string;
  category: string;
  default_english: string;
  default_tamil: string;
  created_at: string;
  updated_at: string;
}

export interface RelationOverride {
  id: number;
  relation_code: string;
  language: string;
  lifestyle: string | null;
  familyname8: string | null;
  family: string | null;
  native: string | null;
  present_city: string | null;
  taluk: string | null;
  district: string | null;
  state: string | null;
  nationality: string | null;
  label: string;
  specificity_score: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: number;
  action: string;
  relation_code: string;
  details: string;
  user_mobile: string;
  user_name: string;
  timestamp: string;
}

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

export interface SuggestionField {
  familyname8s: string[];
  families: string[];
  languages: string[];
  lifestyles: string[];
  categories: Record<string, string>;
}

export interface CreateFixedRelationData {
  relation_code: string;
  category: string;
  default_english: string;
  default_tamil: string;
}

export interface CreateOverrideData {
  level: "language_lifestyle" | "familyname8" | "family";
  relation_code: string;
  language: string;
  lifestyle: string;
  familyname8?: string;
  family?: string;
  label: string;
}

export interface BulkCreateOverrideData {
  level: string;
  overrides: CreateOverrideData[];
}

export interface SearchParams {
  level?: string;
  language?: string;
  lifestyle?: string;
  familyname8?: string;
  family?: string;
  relation_code?: string;
}

export interface SuggestionItem {
  value: string;
  label: string;
}

// Fixed Relations API
export const relationApi = {
  // Fixed Relations
  fetchFixedRelations: async (): Promise<FixedRelation[]> => {
    const response = await api.get("api/admin/fixed-relations/");
    return response.data;
  },

  createFixedRelation: async (
    data: CreateFixedRelationData
  ): Promise<FixedRelation> => {
    const response = await api.post("api/admin/fixed-relations/", data);
    return response.data;
  },

  updateFixedRelation: async (
    id: number,
    data: Partial<CreateFixedRelationData>
  ): Promise<FixedRelation> => {
    const response = await api.put(`api/admin/fixed-relations/${id}/`, data);
    return response.data;
  },

  patchFixedRelation: async (
    id: number,
    data: Partial<CreateFixedRelationData>
  ): Promise<FixedRelation> => {
    const response = await api.patch(`api/admin/fixed-relations/${id}/`, data);
    return response.data;
  },

  deleteFixedRelation: async (id: number): Promise<void> => {
    await api.delete(`api/admin/fixed-relations/${id}/`);
  },

  // Relation Overrides
  fetchOverrides: async (
    params?: SearchParams
  ): Promise<RelationOverride[]> => {
    const response = await api.get("api/admin/relation-overrides/search/", {
      params,
    });
    return response.data;
  },

  createOverride: async (
    data: CreateOverrideData
  ): Promise<RelationOverride> => {
    const response = await api.post(
      "api/admin/relation-overrides/create_override/",
      data
    );
    return response.data;
  },

  deleteOverride: async (level: string, id: number): Promise<void> => {
    await api.delete(
      `api/admin/relation-overrides/delete_override/?level=${level}&id=${id}`
    );
  },

  bulkCreateOverrides: async (data: BulkCreateOverrideData): Promise<any> => {
    const response = await api.post(
      "api/relations/relation-overrides/bulk_create/",
      data
    );
    return response.data;
  },

  // Activity Logs
  fetchActivityLogs: async (): Promise<ActivityLog[]> => {
    const response = await api.get("api/admin/relation-activity-logs/");
    return response.data;
  },

  fetchActivitySummary: async (): Promise<ActivitySummary> => {
    const response = await api.get("api/admin/relation-activity-logs/summary/");
    return response.data;
  },

  // Suggestions
  fetchAllSuggestions: async (): Promise<SuggestionField> => {
    const response = await api.get("api/admin/relation-suggest/all-fields/");
    return response.data;
  },

  searchfamilyname8s: async (
    query: string,
    limit: number = 5
  ): Promise<SuggestionItem[]> => {
    const response = await api.get("api/admin/relation-suggest/familyname8/", {
      params: { q: query, limit },
    });
    return response.data.suggestions || [];
  },

  searchFamilies: async (
    query: string,
    limit: number = 5
  ): Promise<SuggestionItem[]> => {
    const response = await api.get("api/admin/relation-suggest/family/", {
      params: { q: query, limit },
    });
    return response.data.suggestions || [];
  },

  searchRelations: async (
    query: string,
    limit: number = 5
  ): Promise<SuggestionItem[]> => {
    const response = await api.get("api/admin/relation-suggest/relation/", {
      params: { q: query, limit },
    });
    return response.data.suggestions || [];
  },

  // Import/Export
  exportRelations: async (format: "csv" | "json" = "csv"): Promise<Blob> => {
    const response = await api.get(
      `api/admin/relations/export/?format=${format}`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  },

  importRelations: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("api/admin/relations/import/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Validation
  validateRelationCode: async (
    code: string
  ): Promise<{ valid: boolean; message?: string }> => {
    const response = await api.get(
      `api/admin/relations/validate-code/?code=${code}`
    );
    return response.data;
  },
};

export default relationApi;
