import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import {
  Shield,
  Edit,
  Save,
  X,
  UserCheck,
  UserX,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import api from "../../services/api";

interface StaffPermissions {
  can_view_dashboard: boolean;
  can_manage_dashboard: boolean;
  can_view_users: boolean;
  can_edit_users: boolean;
  can_export_data: boolean;
  can_manage_chat: boolean;
  can_manage_post: boolean;
  can_manage_event: boolean;
}

interface RelationPermissions {
  can_manage_fixed_relations: boolean;
  can_manage_language_lifestyle: boolean;
  can_manage_familyname8_overrides: boolean;
  can_manage_family_overrides: boolean;
  can_manage_profile_overrides: boolean;
  can_view_relation_analytics: boolean;
}

// Combined permissions type
type AllPermissions = StaffPermissions & RelationPermissions;

interface StaffMember {
  id: number;
  mobile_number: string;
  full_name: string;
  email: string;
  phone?: string;
  department?: string;
  designation?: string;
  admin_id?: string;
  user_type: "admin" | "staff";
  is_active: boolean;
  is_mobile_verified?: boolean;
  created_at?: string;
  last_login?: string;
  permissions: StaffPermissions;
  relation_permissions?: RelationPermissions;
}

interface StaffPermissionsResponse {
  staff_id: number;
  name: string;
  mobile: string;
  email: string;
  permissions: AllPermissions;
}

interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  permissions: AllPermissions;
}

export function PermissionsManagement() {
  const { t } = useLanguage();

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<boolean>(false);
  const [editedPermissions, setEditedPermissions] =
    useState<AllPermissions | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [permissionTemplates, setPermissionTemplates] = useState<
    PermissionTemplate[]
  >([]);

  // Fetch staff members on component mount
  useEffect(() => {
    fetchStaffMembers();
    fetchPermissionTemplates();
  }, []);

  const fetchStaffMembers = async () => {
    try {
      setInitialLoading(true);
      setError(null);

      console.log("Fetching staff members from: /api/admin/staff/");

      // Using your axios instance - note the path matches your Django URLs
      const response = await api.get("/api/admin/staff/");

      console.log("Staff response:", response.data);

      // Handle different response formats (array or object with results)
      const staffData = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      // Transform the data to match our interface
      const transformedStaff = staffData.map((staff: any) => ({
        id: staff.id,
        mobile_number: staff.mobile_number,
        full_name: staff.full_name || staff.name || "",
        email: staff.email || "",
        phone: staff.phone,
        department: staff.department,
        designation: staff.designation,
        admin_id: staff.admin_id,
        user_type: staff.user_type || "staff",
        is_active: staff.is_active !== undefined ? staff.is_active : true,
        is_mobile_verified: staff.is_mobile_verified,
        created_at: staff.created_at,
        last_login: staff.last_login,
        permissions: staff.permissions || {
          can_view_dashboard: false,
          can_manage_dashboard: false,
          can_view_users: false,
          can_edit_users: false,
          can_export_data: false,
          can_manage_chat: false,
          can_manage_post: false,
          can_manage_event: false,
        },
        relation_permissions: staff.relation_permissions,
      }));

      setStaffMembers(transformedStaff);
    } catch (err: any) {
      console.error("Error fetching staff:", err);

      let errorMessage = "Failed to load staff members";

      if (err.code === "ERR_NETWORK") {
        errorMessage =
          "Cannot connect to server. Please check if the server is running at http://192.168.1.44:8002";
      } else if (err.response) {
        console.error("Response status:", err.response.status);
        console.error("Response data:", err.response.data);

        if (err.response.status === 404) {
          errorMessage =
            "API endpoint not found. Please check if the server is running the correct Django application.";
        } else if (err.response.status === 403) {
          errorMessage = "You do not have permission to view staff members";
        } else if (err.response.status === 401) {
          errorMessage = "Your session has expired. Please login again.";
        } else if (err.response.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data?.error) {
          errorMessage = err.response.data.error;
        }
      }

      setError(errorMessage);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchPermissionTemplates = async () => {
    try {
      console.log("Fetching templates from: /api/admin/permissions/templates/");
      const response = await api.get("/api/admin/permissions/templates/");
      console.log("Templates response:", response.data);

      // Convert the template object to array format
      if (response.data && typeof response.data === "object") {
        const templatesArray = Object.entries(response.data).map(
          ([id, template]: [string, any]) => ({
            id,
            name: template.name,
            description: template.description,
            permissions: template.permissions,
          })
        );
        setPermissionTemplates(templatesArray);
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
      // Fallback to default templates if API fails
      setPermissionTemplates([
        {
          id: "viewer",
          name: "Viewer",
          description: "Can only view data, no edits",
          permissions: {
            can_view_dashboard: true,
            can_manage_dashboard: false,
            can_view_users: true,
            can_edit_users: false,
            can_export_data: true,
            can_manage_chat: false,
            can_manage_post: false,
            can_manage_event: false,
            can_manage_fixed_relations: false,
            can_manage_language_lifestyle: false,
            can_manage_familyname8_overrides: false,
            can_manage_family_overrides: false,
            can_manage_profile_overrides: false,
            can_view_relation_analytics: true,
          },
        },
        {
          id: "editor",
          name: "Editor",
          description: "Can edit user data but not manage staff",
          permissions: {
            can_view_dashboard: true,
            can_manage_dashboard: false,
            can_view_users: true,
            can_edit_users: true,
            can_export_data: true,
            can_manage_chat: true,
            can_manage_post: true,
            can_manage_event: true,
            can_manage_fixed_relations: false,
            can_manage_language_lifestyle: true,
            can_manage_familyname8_overrides: true,
            can_manage_family_overrides: true,
            can_manage_profile_overrides: true,
            can_view_relation_analytics: true,
          },
        },
        {
          id: "manager",
          name: "Manager",
          description: "Full access except staff management",
          permissions: {
            can_view_dashboard: true,
            can_manage_dashboard: true,
            can_view_users: true,
            can_edit_users: true,
            can_export_data: true,
            can_manage_chat: true,
            can_manage_post: true,
            can_manage_event: true,
            can_manage_fixed_relations: true,
            can_manage_language_lifestyle: true,
            can_manage_familyname8_overrides: true,
            can_manage_family_overrides: true,
            can_manage_profile_overrides: true,
            can_view_relation_analytics: true,
          },
        },
      ]);
    }
  };

  const handleStaffSelect = async (staff: StaffMember) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedStaff(staff);

      console.log("Fetching permissions for staff:", staff.id);
      console.log("URL:", `/api/admin/staff/${staff.id}/permissions/`);

      // Fetch detailed permissions from your backend
      const response = await api.get(
        `/api/admin/staff/${staff.id}/permissions/`
      );

      console.log("Permissions response:", response.data);

      // Update selected staff with permissions
      setSelectedStaff({
        ...staff,
        permissions: response.data.permissions,
        relation_permissions: response.data.permissions, // The response might have all permissions combined
      });

      setEditingPermissions(false);
      setEditedPermissions(null);
    } catch (err: any) {
      console.error("Error fetching permissions:", err);

      let errorMessage = "Failed to load permissions";
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.status === 404) {
        errorMessage =
          "Permissions endpoint not found. Please check the API URL.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPermissions = () => {
    if (!selectedStaff) return;

    // Combine staff and relation permissions for editing
    setEditedPermissions({
      ...selectedStaff.permissions,
      ...(selectedStaff.relation_permissions || {}),
    } as AllPermissions);

    setEditingPermissions(true);
    setError(null);
  };

  const handlePermissionChange = (
    permission: keyof AllPermissions,
    value: boolean
  ) => {
    if (!editedPermissions) return;
    setEditedPermissions({
      ...editedPermissions,
      [permission]: value,
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedStaff || !editedPermissions) return;

    try {
      setSaveLoading(true);
      setError(null);
      setSuccessMessage(null);

      console.log("Saving permissions for staff:", selectedStaff.id);
      console.log("URL:", `/api/admin/staff/${selectedStaff.id}/permissions/`);
      console.log("Permissions data:", editedPermissions);

      // Send the updated permissions to your backend
      const response = await api.put(
        `/api/admin/staff/${selectedStaff.id}/permissions/`,
        editedPermissions
      );

      console.log("Save response:", response.data);

      // Update local state
      const updatedStaff = {
        ...selectedStaff,
        permissions: editedPermissions,
        relation_permissions: editedPermissions,
      };

      setSelectedStaff(updatedStaff);

      // Update staff in the list
      setStaffMembers((prev) =>
        prev.map((s) => (s.id === selectedStaff.id ? updatedStaff : s))
      );

      setSuccessMessage("Permissions updated successfully");
      setEditingPermissions(false);
      setEditedPermissions(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Error saving permissions:", err);

      let errorMessage = "Failed to update permissions";
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.errors) {
        errorMessage = Object.values(err.response.data.errors)
          .flat()
          .join(", ");
      } else if (err.response?.status === 404) {
        errorMessage = "Update endpoint not found. Please check the API URL.";
      }

      setError(errorMessage);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingPermissions(false);
    setEditedPermissions(null);
    setError(null);
  };

  const handleApplyTemplate = (template: PermissionTemplate) => {
    if (!selectedStaff) return;
    setEditedPermissions(template.permissions);
    setError(null);
  };

  const getPermissionLabel = (key: string): string => {
    const labels: Record<string, string> = {
      can_view_dashboard: "View Dashboard",
      can_manage_dashboard: "Manage Dashboard",
      can_view_users: "View Users",
      can_edit_users: "Edit Users",
      can_export_data: "Export Data",
      can_manage_chat: "Chat Management",
      can_manage_post: "Post Management",
      can_manage_event: "Event Management",
      can_manage_fixed_relations: "Manage Fixed Relations",
      can_manage_language_lifestyle: "Manage Language/lifestyle",
      can_manage_familyname8_overrides: "Manage familyname8 Overrides",
      can_manage_family_overrides: "Manage Family Overrides",
      can_manage_profile_overrides: "Manage Profile Overrides",
    };
    return (
      labels[key] ||
      key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    );
  };


  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Permission Management
        </h1>
        <button
          onClick={fetchStaffMembers}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Staff Members ({staffMembers.length})
          </h2>

          {staffMembers.length === 0 && !error ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No staff members found</p>
              <button
                onClick={fetchStaffMembers}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-150overflow-y-auto pr-2">
              {staffMembers.map((staff) => (
                <div
                  key={staff.id}
                  onClick={() => handleStaffSelect(staff)}
                  className={`bg-white rounded-lg shadow-sm border-2 p-4 cursor-pointer transition-all ${selectedStaff?.id === staff.id
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-red-300"
                    }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield
                        className={`w-5 h-5 ${staff.is_active ? "text-red-600" : "text-gray-400"
                          }`}
                      />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {staff.full_name || "Unnamed"}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {staff.mobile_number}
                        </p>
                      </div>
                    </div>
                    {staff.is_active ? (
                      <UserCheck className="w-4 h-4 text-green-600 shrink-0" />
                    ) : (
                      <UserX className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`px-2 py-1 rounded-full ${staff.user_type === "admin"
                        ? "bg-red-100 text-red-700"
                        : "bg-orange-100 text-orange-700"
                        }`}
                    >
                      {staff.user_type}
                    </span>
                    <span className="text-gray-500 truncate ml-2">
                      {staff.email || "No email"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Permissions Details */}
        <div className="lg:col-span-2">
          {selectedStaff ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Staff Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 truncate">
                    {selectedStaff.full_name || "Unnamed"}
                  </h2>
                  <p className="text-sm text-gray-600 truncate">
                    {selectedStaff.email || "No email"} •{" "}
                    {selectedStaff.mobile_number}
                  </p>
                  {selectedStaff.department && (
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedStaff.department}{" "}
                      {selectedStaff.designation &&
                        `• ${selectedStaff.designation}`}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {!editingPermissions ? (
                    <button
                      onClick={handleEditPermissions}
                      disabled={loading || saveLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Permissions
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSavePermissions}
                        disabled={saveLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saveLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={saveLoading}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Permission Templates (only when editing) */}
              {editingPermissions && permissionTemplates.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Apply Template
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {permissionTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleApplyTemplate(template)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Permissions Tables */}
              <div className="space-y-8">
                {/* Staff Permissions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Staff Permissions
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Permission
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {[
                          "can_view_dashboard",
                          "can_manage_dashboard",
                          "can_view_users",
                          "can_edit_users",
                          "can_manage_chat",
                          "can_manage_post",
                          "can_manage_event"
                        ].map((key) => (
                          <tr key={key}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {getPermissionLabel(key)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {editingPermissions ? (
                                <input
                                  type="checkbox"
                                  checked={
                                    editedPermissions?.[
                                    key as keyof StaffPermissions
                                    ] || false
                                  }
                                  onChange={(e) =>
                                    handlePermissionChange(
                                      key as keyof AllPermissions,
                                      e.target.checked
                                    )
                                  }
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                              ) : (
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedStaff.permissions[
                                    key as keyof StaffPermissions
                                  ]
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                    }`}
                                >
                                  {selectedStaff.permissions[
                                    key as keyof StaffPermissions
                                  ]
                                    ? "Enabled"
                                    : "Disabled"}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Relation Management Permissions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Relation Management Permissions
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Permission
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {[
                          "can_manage_fixed_relations",

                          "can_manage_profile_overrides",
                        ].map((key) => (
                          <tr key={key}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {getPermissionLabel(key)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {editingPermissions ? (
                                <input
                                  type="checkbox"
                                  checked={
                                    editedPermissions?.[
                                    key as keyof RelationPermissions
                                    ] || false
                                  }
                                  onChange={(e) =>
                                    handlePermissionChange(
                                      key as keyof AllPermissions,
                                      e.target.checked
                                    )
                                  }
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                              ) : (
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedStaff.relation_permissions?.[
                                    key as keyof RelationPermissions
                                  ]
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                    }`}
                                >
                                  {selectedStaff.relation_permissions?.[
                                    key as keyof RelationPermissions
                                  ]
                                    ? "Enabled"
                                    : "Disabled"}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Select a staff member to view and manage permissions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}