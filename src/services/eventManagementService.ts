import api from "./api";

export interface EventUser {
  id: number;
  username?: string;
  mobile_number?: string;
  full_name?: string;
  is_mobile_verified?: boolean;
}

export interface EventType {
  id: number;
  title: string;
  created_by?: number;
  family?: any;
  is_public?: boolean;
  usage_count?: number;
  created_at?: string;
}

export interface Visibility {
  id: number;
  code: string;
  name: string;
  description: string;
  is_enabled: boolean;
}

export interface RSVPSummary {
  going: number;
  maybe: number;
  not_going: number;
  total: number;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  event_type?: number;
  event_type_title?: string;
  created_by?: number;
  created_by_name?: string;
  visibility?: number;
  visibility_name?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";
  start_date: string;
  end_date: string | null;
  is_all_day: boolean;
  location_name: string;
  city?: string;
  is_virtual: boolean;
  cover_image_url?: string | null;
  rsvp_going?: number;
  rsvp_maybe?: number;
  rsvp_not_going?: number;
  view_count?: number;
  comment_count?: number;
  created_at: string;
  flag_count?: number;
}

export interface EventFlag {
  id: number;
  reason: string;
  description: string;
  status: string;
  reported_by: string;
  created_at: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_note?: string;
}

export interface EventFlagsResponse {
  event_id: number;
  event_title: string;
  total_flags: number;
  flags: EventFlag[];
}

export interface FlagEventPayload {
  reason: string;
  description: string;
}

export interface ResolveFlagPayload {
  action: "approve" | "reject"; // Changed to match backend
  note: string;
}

export interface ModerateResponse {
  message: string;
  status?: string;
  data?: any;
}

export interface RestrictUserResponse {
  message: string;
  success: boolean;
  data?: any;
}

export interface UpdateEventPayload {
  title?: string;
  description?: string;
  location_name?: string;
  start_date?: string;
  end_date?: string;
  is_all_day?: boolean;
  is_virtual?: boolean;
  event_type?: number;
  visibility?: number;
}

export interface UpdateEventResponse {
  message: string;
  data?: Event;
}

export interface EventStats {
  total_events: number;
  upcoming: number;
  past: number;
  by_status: {
    PENDING: number;
    APPROVED: number;
    REJECTED: number;
    FLAGGED: number;
  };
  by_visibility: {
    PUBLIC: number;
    CONNECTED: number;
    FAMILY: number;
    PRIVATE: number;
  };
  total_rsvps: number;
  total_comments: number;
  total_media: number;
  flagged_count: number;
}

export interface EventConfig {
  default_visibility: number;
  default_visibility_code: string;
  default_visibility_name: string;
  max_allowed_visibility: string;
  auto_approve: boolean;
  require_moderation: boolean;
  updated_at: string;
}

export interface UpdateEventConfigPayload {
  default_visibility?: number;
  max_allowed_visibility?: string;
  auto_approve?: boolean;
  require_moderation?: boolean;
}

export interface RestrictUserPayload {
  user_id: number;
  can_create_events: boolean;
  max_visibility: string;
  blocked_lifestyles: number[];
  blocked_familyname8s: number[];
  blocked_families: number[];
  restricted_to_visibility: number[];
  restriction_reason: string;
}

export const eventManagementService = {
  getPendingEvents: async () => {
    const response = await api.get<Event[]>(
      "/api/event_management/events/pending/"
    );
    return response.data;
  },

  getEventsByStatus: async (
    status?: "PENDING" | "APPROVED" | "REJECTED" | "ALL"
  ) => {
    const params = status && status !== "ALL" ? { status } : {};
    const response = await api.get<Event[]>("/api/event_management/events/", {
      params,
    });
    return response.data;
  },

  getFlaggedEvents: async () => {
    const response = await api.get<Event[]>(
      "/api/event_management/events/flagged/"
    );
    return response.data;
  },

  moderateEvent: async (
    id: number,
    action: "approve" | "reject",
    note?: string
  ) => {
    const response = await api.post<ModerateResponse>(
      `/api/event_management/events/${id}/moderate/`,
      {
        action,
        note,
      }
    );
    return response.data;
  },

  // New method to update an event
  updateEvent: async (id: number, payload: UpdateEventPayload) => {
    const response = await api.patch<UpdateEventResponse>(
      `/api/event_management/events/${id}/`,
      payload
    );
    return response.data;
  },

  getEventStats: async () => {
    const response = await api.get<EventStats>(
      "/api/event_management/events/stats/"
    );
    return response.data;
  },

  getEventConfig: async () => {
    const response = await api.get<EventConfig>(
      "/api/event_management/event-config/get/"
    );
    return response.data;
  },

  updateEventConfig: async (config: UpdateEventConfigPayload) => {
    const response = await api.post<EventConfig>(
      "/api/event_management/event-config/custom_update/",
      config
    );
    return response.data;
  },

  restrictUser: async (payload: RestrictUserPayload) => {
    const response = await api.post<RestrictUserResponse>(
      "/api/event_management/admin/config/restrict_user/",
      payload
    );
    return response.data;
  },

  // Methods for flagging functionality
  getEventFlags: async (eventId: number) => {
    const response = await api.get<EventFlagsResponse>(
      `/api/event_management/events/${eventId}/flags/`
    );
    return response.data;
  },

  flagEvent: async (eventId: number, payload: FlagEventPayload) => {
    const response = await api.post<{ message: string }>(
      `/api/event_management/events/${eventId}/flag/`,
      payload
    );
    return response.data;
  },

  // Fixed resolveFlag method - using moderate endpoint with approve/reject actions
  resolveFlag: async (flagId: number, payload: ResolveFlagPayload) => {
    // Map our UI actions to backend actions
    const backendAction = payload.action === "approve" ? "approve" : "reject";
    const response = await api.post<ModerateResponse>(
      `/api/event_management/events/${flagId}/moderate/`,
      {
        action: backendAction,
        note: payload.note,
      }
    );
    return response.data;
  },
};
