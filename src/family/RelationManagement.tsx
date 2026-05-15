import { useState, useEffect, useCallback, SetStateAction } from "react";
import { useAuth } from "../context/AuthContext";
import { PermissionDenied } from "../components/common/PermissionDenied";
import { PermissionGranted } from "../components/common/PermissionGranted";
import { useLanguage } from "../context/LanguageContext";
import {
  Network,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Users,
  Globe,
  Home,
  Layers,
  History,
  RefreshCw,
  XCircle,
  Clock,
  User,
  Eye,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Building2,
  Flag,
  GitBranch,
} from "lucide-react";
import { IoDuplicate } from "react-icons/io5";
import api from "../services/api";
import { toast } from "react-hot-toast";

interface FixedRelation {
  id: number;
  relation_code: string;
  category: string;
  default_english: string;
  default_tamil: string;
  created_at: string;
  updated_at: string;
}

interface RelationOverride {
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

interface InverseRelation {
  relation_code: string;
  inverse_for_male: string | null;
  inverse_for_female: string | null;
  inverse_for_other: string | null;
}

interface ActivityLog {
  id: number;
  action: string;
  relation_code: string;
  description: string;
  user_info: {
    mobile_number: string;
    full_name: string;
    admin_id: string;
  };
  affected_level: string;
  ip_address: string;
  metadata: Record<string, any>;
  created_at: string;
}

interface ActivitySummary {
  today: number;
  this_week: number;
  by_action: Record<string, number>;
  top_users: Array<{
    mobile_number: string;
    full_name: string;
    activity_count: number;
  }>;
}

interface SuggestionField {
  familyname8s: string[];
  families: string[];
  languages: string[];
  lifestyles: string[];
  categories: Record<string, string>;
  natives: string[];
  cities: string[];
  taluks: string[];
  districts: string[];
  states: string[];
  nationalities: string[];
}

// Calendar icon component
const Calendar = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
    />
  </svg>
);

// Inline Activity Logs Component
const ActivityLogsContent = ({
  logs,
  summary,
  onClose,
  onRefresh,
  onFilter,
}: any) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFiltering, setIsFiltering] = useState(false);

  const getActionBadge = (action: string) => {
    const colorConfig: Record<string, string> = {
      create:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      update:
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      delete: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      approve:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      reject:
        "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
      relation_create:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      relation_update:
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      relation_delete:
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      override_create:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      override_update:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      override_delete:
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };

    const color =
      colorConfig[action] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${color}`}
      >
        {action.replace("_", " ")}
      </span>
    );
  };

  const handleApplyFilter = async () => {
    setIsFiltering(true);
    try {
      const filters: any = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (filterAction !== "all") filters.action = filterAction;

      await onFilter(filters);
    } finally {
      setIsFiltering(false);
    }
  };

  const handleClearFilter = async () => {
    setSearchTerm("");
    setFilterAction("all");
    setStartDate("");
    setEndDate("");
    await onFilter({});
  };

  const filteredLogs = logs.filter((log: ActivityLog) => {
    if (
      searchTerm &&
      !(
        log.relation_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_info.full_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        log.user_info.mobile_number.includes(searchTerm) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    ) {
      return false;
    }

    return true;
  });

  const uniqueActions = Array.from(
    new Set(logs.map((log: ActivityLog) => log.action))
  );

  return (
    <div>
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Today's Activities
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {summary.today}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              This Week
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {summary.this_week}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Top User
            </h3>
            {summary.top_users && summary.top_users.length > 0 ? (
              <div className="mt-2">
                <p className="font-medium text-gray-900 dark:text-white">
                  {summary.top_users[0].full_name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {summary.top_users[0].activity_count} activities
                </p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                -
              </p>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Most Common Action
            </h3>
            {summary.by_action &&
              Object.entries(summary.by_action).length > 0 ? (
              <div className="mt-2">
                <p className="font-medium text-gray-900 dark:text-white capitalize">
                  {Object.entries(summary.by_action)
                    .sort(([, a], [, b]) => (b as number) - (a as number))[0][0]
                    .replace("_", " ")}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {
                    Object.entries(summary.by_action).sort(
                      ([, a], [, b]) => (b as number) - (a as number)
                    )[0][1] as React.ReactNode
                  }{" "}
                  times
                </p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                -
              </p>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-gray-900 dark:text-white">Filters</h3>
          <div className="flex gap-2">
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleClearFilter}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Action Type
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-900"
              >
                <option value="all">All Actions</option>
                {uniqueActions.map((action) => (
                  <option key={action as string} value={action as string}>
                    {(action as string).replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search activities..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Apply Filter button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleApplyFilter}
            disabled={isFiltering}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {isFiltering ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Applying...
              </>
            ) : (
              <>
                <Filter className="w-4 h-4" />
                Apply Date/Action Filters
              </>
            )}
          </button>
        </div>
      </div>

      {/* Activity Logs List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <History className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No activity logs found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your filters or check back later
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredLogs.map((log: ActivityLog) => (
              <div
                key={log.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getActionBadge(log.action)}
                      <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                        {log.relation_code}
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                        {log.affected_level}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      {log.description}
                    </p>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <User className="w-4 h-4 mr-1" />
                      {log.user_info.full_name} ({log.user_info.mobile_number})
                      <span className="mx-2">•</span>
                      <Globe className="w-4 h-4 mr-1" />
                      {log.ip_address}
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 ml-4">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {filteredLogs.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredLogs.length} of {logs.length} activities
        </div>
      )}
    </div>
  );
};

// Inverse Relations Content Component
const InverseRelationsContent = ({
  inverseMappings,
  onUpdateInverse,
  onRefresh,
  loading,
}: any) => {
  const [editingRelation, setEditingRelation] = useState<string | null>(null);
  const [editData, setEditData] = useState<InverseRelation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredMappings = inverseMappings.filter((item: InverseRelation) =>
    item.relation_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredMappings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMappings = filteredMappings.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleEdit = (relation: InverseRelation) => {
    setEditingRelation(relation.relation_code);
    setEditData({ ...relation });
  };

  const handleSave = async () => {
    if (!editData) return;

    await onUpdateInverse(editData.relation_code, {
      inverse_for_male: editData.inverse_for_male,
      inverse_for_female: editData.inverse_for_female,
      inverse_for_other: editData.inverse_for_other,
    });

    setEditingRelation(null);
    setEditData(null);
  };

  const handleCancel = () => {
    setEditingRelation(null);
    setEditData(null);
  };

  const getRelationOptions = () => {
    return inverseMappings.map((item: InverseRelation) => ({
      value: item.relation_code,
      label: item.relation_code,
    }));
  };

  const relationOptions = getRelationOptions();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-red-600" />
            Inverse Relations Mapping
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Define inverse relationships for each relation code based on gender
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by relation code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-900"
          />
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <th className="sticky left-0 z-20 py-3.5 px-4 text-left font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800">
                Relation Code
              </th>
              <th className="py-3.5 px-4 text-left font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight">
                Inverse For Male
              </th>
              <th className="py-3.5 px-4 text-left font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight">
                Inverse For Female
              </th>
              <th className="py-3.5 px-4 text-left font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight">
                Inverse For Other
              </th>
              <th className="sticky right-0 z-20 py-3.5 px-4 text-center font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight bg-gray-50 dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800">
                Actions
              </th>
             </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {paginatedMappings.map((relation: InverseRelation) => (
              <tr
                key={relation.relation_code}
                className="hover:bg-gray-50/50 dark:hover:bg-gray-900/40 transition-colors"
              >
                <td className="sticky left-0 z-10 py-3 px-4 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-800 font-mono font-bold text-red-600 dark:text-red-400">
                  {relation.relation_code}
                </td>

                {/* Inverse For Male */}
                <td className="py-3 px-4">
                  {editingRelation === relation.relation_code ? (
                    <select
                      value={editData?.inverse_for_male || ""}
                      onChange={(e) =>
                        setEditData((prev) =>
                          prev ? { ...prev, inverse_for_male: e.target.value || null } : null
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-900 text-sm"
                    >
                      <option value="">None</option>
                      {relationOptions.map((opt: any) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-gray-900 dark:text-white">
                      {relation.inverse_for_male || (
                        <span className="text-gray-400 italic">Not set</span>
                      )}
                    </span>
                  )}
                </td>

                {/* Inverse For Female */}
                <td className="py-3 px-4">
                  {editingRelation === relation.relation_code ? (
                    <select
                      value={editData?.inverse_for_female || ""}
                      onChange={(e) =>
                        setEditData((prev) =>
                          prev ? { ...prev, inverse_for_female: e.target.value || null } : null
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-900 text-sm"
                    >
                      <option value="">None</option>
                      {relationOptions.map((opt: any) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-gray-900 dark:text-white">
                      {relation.inverse_for_female || (
                        <span className="text-gray-400 italic">Not set</span>
                      )}
                    </span>
                  )}
                </td>

                {/* Inverse For Other */}
                <td className="py-3 px-4">
                  {editingRelation === relation.relation_code ? (
                    <select
                      value={editData?.inverse_for_other || ""}
                      onChange={(e) =>
                        setEditData((prev) =>
                          prev ? { ...prev, inverse_for_other: e.target.value || null } : null
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-900 text-sm"
                    >
                      <option value="">None</option>
                      {relationOptions.map((opt: any) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-gray-900 dark:text-white">
                      {relation.inverse_for_other || (
                        <span className="text-gray-400 italic">Not set</span>
                      )}
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="sticky right-0 z-10 py-3 px-2 bg-white dark:bg-gray-800 border-l border-gray-100 dark:border-gray-800 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">
                  <div className="flex items-center justify-center gap-1">
                    {editingRelation === relation.relation_code ? (
                      <>
                        <button
                          onClick={handleSave}
                          className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                          title="Save"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                          title="Cancel"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleEdit(relation)}
                        className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                        title="Edit Inverse Relations"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/30 flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Showing <span className="font-bold">{startIndex + 1}</span> to{" "}
          <span className="font-bold">
            {Math.min(startIndex + itemsPerPage, filteredMappings.length)}
          </span>{" "}
          of <span className="font-bold">{filteredMappings.length}</span>{" "}
          relations
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 border border-red-100 dark:border-red-900/30 rounded-lg disabled:opacity-30 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 px-2">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 border border-red-100 dark:border-red-900/30 rounded-lg disabled:opacity-30 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export function RelationManagement() {
  const { t } = useLanguage();
  const { user, role } = useAuth();

  const [accessDenied, setAccessDenied] = useState(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState('');

  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<SuggestionField | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("relations");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterlifestyle, setFilterlifestyle] = useState<string>("all");
  const [filterfamilyname8, setFilterfamilyname8] = useState<string>("all");
  const [filterRelationCode, setFilterRelationCode] = useState<string>("");
  const [filterDistrict, setFilterDistrict] = useState<string>("all");
  const [overridelifestyles, setOverridelifestyles] = useState<string[]>([]);
  const [overridefamilyname8s, setOverridefamilyname8s] = useState<string[]>(
    []
  );
  const [overrideDistricts, setOverrideDistricts] = useState<string[]>([]);

  // Data states
  const [fixedRelations, setFixedRelations] = useState<any[]>([]);
  const [totalFixedRelations, setTotalFixedRelations] = useState(0);
  const [fixedPage, setFixedPage] = useState(1);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [totalOverrides, setTotalOverrides] = useState(0);
  const [overridePage, setOverridePage] = useState(1);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [inverseMappings, setInverseMappings] = useState<InverseRelation[]>([]);
  const [inverseLoading, setInverseLoading] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<FixedRelation | null>(
    null
  );
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [editingOverride, setEditingOverride] =
    useState<RelationOverride | null>(null);
  const [viewingItem, setViewingItem] = useState<
    FixedRelation | RelationOverride | null
  >(null);
  const [error, setError] = useState<string>('');
  const [createRelationError, setCreateRelationError] = useState<string>('');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: (id: number) => performDeleteFixedRelation(id),
  });

  // Specific permission states
  const [fixedRelationsDenied, setFixedRelationsDenied] = useState(false);
  const [overridesDenied, setOverridesDenied] = useState(false);
  const [activityLogsDenied, setActivityLogsDenied] = useState(false);
  const [inverseMappingsDenied, setInverseMappingsDenied] = useState(false);
  const [fixedRelationsDeniedMsg, setFixedRelationsDeniedMsg] = useState('');
  const [overridesDeniedMsg, setOverridesDeniedMsg] = useState('');
  const [activityLogsDeniedMsg, setActivityLogsDeniedMsg] = useState('');
  const [inverseMappingsDeniedMsg, setInverseMappingsDeniedMsg] = useState('');

  // Form states
  const [newRelation, setNewRelation] = useState({
    relation_code: "",
    default_english: "",
    default_tamil: "",
    match_token: "",
    composition_token: "",
  });

  const [newOverride, setNewOverride] = useState({
    relation_code: "",
    language: "",
    lifestyle: "",
    familyname8: "",
    family: "",
    native: "",
    present_city: "",
    taluk: "",
    district: "",
    state: "",
    nationality: "",
    label: "",
  });

  // Predefined categories
  const categoryOptions = [
    { value: "PARENT", label: "Parent" },
    { value: "CHILD", label: "Child" },
    { value: "SPOUSE", label: "Spouse" },
    { value: "SIBLING", label: "Sibling" },
    { value: "GRANDPARENT", label: "Grandparent" },
    { value: "GRANDCHILD", label: "Grandchild" },
    { value: "OTHER", label: "Other" },
  ];

  // Language options
  const languageOptions = [
    { value: "ta", label: "தமிழ் (Tamil)" },
    { value: "en", label: "English" },
  ];

  // Fetch overrides when filters change
  useEffect(() => {
    if (activeTab === "overrides") {
      fetchOverrides();
    }
  }, [
    filterCategory,
    filterlifestyle,
    filterfamilyname8,
    filterRelationCode,
    filterDistrict,
    activeTab,
  ]);

  // Fetch inverse relations when tab changes to inverse
  useEffect(() => {
    if (activeTab === "inverse") {
      fetchInverseMappings();
    }
  }, [activeTab]);

  const fetchSuggestions = async () => {
    try {
      const response = await api.get("api/admin/relation-suggest/all-fields/");
      setSuggestions(response.data);
    } catch (error: any) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions(null);
    }
  };

  useEffect(() => {
    fetchAllData();
    fetchSuggestions();
    fetchOverrideFilters();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.allSettled([
        fetchFixedRelations(),
        fetchOverrides(),
        fetchActivitySummary(),
        fetchActivityLogs(),
        fetchInverseMappings(),
      ]);
    } catch (error: any) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFixedRelations = async (page: number = 1, search: string = "") => {
    try {
      setFixedRelationsDenied(false);
      const params: any = { page };
      if (search) params.search = search;
      if (filterCategory !== "all") params.category = filterCategory;

      const response = await api.get("api/admin/fixed-relations/", { params });

      const data = response.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setFixedRelations(data.results || []);
        setTotalFixedRelations(data.count || 0);
      } else if (Array.isArray(data)) {
        setFixedRelations(data);
        setTotalFixedRelations(data.length);
      }
      setError('');
    } catch (error: any) {
      console.error("Error fetching fixed relations:", error);

      if (error.response?.status === 403) {
        const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.response?.data?.message || 'You do not have permission to view fixed relations.';
        setFixedRelationsDenied(true);
        setFixedRelationsDeniedMsg(errorMessage);
        return;
      }

      setError('Failed to load fixed relations');
    }
  };

  const fetchOverrides = async (page: number = 1, search: string = "") => {
    try {
      const params: any = { page };

      if (search) {
        params.search = search;
      }

      if (filterlifestyle !== "all" && filterlifestyle) {
        params.lifestyle = filterlifestyle;
      }

      if (filterfamilyname8 !== "all" && filterfamilyname8) {
        params.familyname8 = filterfamilyname8;
      }

      if (filterRelationCode) {
        params.relation_code = filterRelationCode;
      }

      if (filterDistrict !== "all" && filterDistrict) {
        params.district = filterDistrict;
      }

      console.log('Fetching overrides with params:', params);
      const response = await api.get("api/admin/profile-overrides/", {
        params,
      });
      console.log('Overrides API response:', response.data);

      const data = response.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setOverrides(data.results || []);
        setTotalOverrides(data.count || 0);
      } else if (Array.isArray(data)) {
        setOverrides(data);
        setTotalOverrides(data.length);
      }

      setError('');
      setOverridesDenied(false);
    } catch (error: any) {
      console.error("Error fetching overrides:", error);

      if (error.response?.status === 403) {
        const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.response?.data?.message || 'You do not have permission to view relation overrides.';
        console.error('403 Permission denied for overrides:', errorMessage);
        setOverridesDenied(true);
        setOverridesDeniedMsg(errorMessage);
        setOverrides([]);
        return;
      }

      setError('Failed to load relation overrides');
      setOverrides([]);
    }
  };

  const fetchInverseMappings = async () => {
    try {
      setInverseLoading(true);
      const response = await api.get("api/relations/api/admin/inverse/");

      let inverseData = response.data;

      if (inverseData && typeof inverseData === "object") {
        if (Array.isArray(inverseData.inverse_mappings)) {
          inverseData = inverseData.inverse_mappings;
        } else if (Array.isArray(inverseData.results)) {
          inverseData = inverseData.results;
        } else if (Array.isArray(inverseData.data)) {
          inverseData = inverseData.data;
        }
      }

      setInverseMappings(Array.isArray(inverseData) ? inverseData : []);
      setInverseMappingsDenied(false);
    } catch (error: any) {
      console.error("Error fetching inverse mappings:", error);

      if (error.response?.status === 403) {
        const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.response?.data?.message || 'You do not have permission to view inverse relations.';
        setInverseMappingsDenied(true);
        setInverseMappingsDeniedMsg(errorMessage);
      }

      setInverseMappings([]);
      toast.error("Failed to load inverse relations");
    } finally {
      setInverseLoading(false);
    }
  };

  const updateInverseRelation = async (relationCode: string, data: {
    inverse_for_male: string | null;
    inverse_for_female: string | null;
    inverse_for_other: string | null;
  }) => {
    try {
      const response = await api.put("api/relations/api/admin/inverse/", {
        relation_code: relationCode,
        ...data
      });

      if (response.status === 200) {
        toast.success(`Inverse relations for ${relationCode} updated successfully`);
        await fetchInverseMappings();
        await fetchActivitySummary();
        return true;
      }
    } catch (error: any) {
      console.error("Error updating inverse relations:", error);
      toast.error(error.response?.data?.error || "Failed to update inverse relations");
      return false;
    }
  };

  const fetchActivityLogs = async (filters?: {
    startDate?: string;
    endDate?: string;
    action?: string;
  }) => {
    try {
      const params: any = {};
      if (filters?.startDate) params.start_date = filters.startDate;
      if (filters?.endDate) params.end_date = filters.endDate;
      if (filters?.action && filters.action !== "all")
        params.action = filters.action;

      const response = await api.get("api/admin/relation-activity-logs/", {
        params,
      });
      let logsData = response.data;

      if (logsData && typeof logsData === "object") {
        if (Array.isArray(logsData.results)) {
          logsData = logsData.results;
        } else if (Array.isArray(logsData.data)) {
          logsData = logsData.data;
        } else if (Array.isArray(logsData.logs)) {
          logsData = logsData.logs;
        } else if (Array.isArray(logsData)) {
          logsData = logsData;
        } else {
          logsData = [];
        }
      }

      const transformedLogs: ActivityLog[] = logsData.map((log: any) => ({
        id: log.id,
        action: log.action,
        relation_code: log.relation_code,
        description: log.description,
        user_info: log.user_info || {
          mobile_number: "",
          full_name: "",
          admin_id: "",
        },
        affected_level: log.affected_level,
        ip_address: log.ip_address,
        metadata: log.metadata || {},
        created_at: log.created_at,
      }));

      setActivityLogs(transformedLogs);
      setActivityLogsDenied(false);
    } catch (error: any) {
      console.error("Error fetching activity logs:", error);
      if (error.response?.status === 403) {
        const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.response?.data?.message || 'You do not have permission to view activity logs.';
        setActivityLogsDenied(true);
        setActivityLogsDeniedMsg(errorMessage);
        return;
      }
      setActivityLogs([]);
    }
  };

  const fetchActivitySummary = async () => {
    try {
      const response = await api.get(
        "api/admin/relation-activity-logs/summary/"
      );
      setActivitySummary(response.data);
      setActivityLogsDenied(false);
    } catch (error: any) {
      console.error("Error fetching activity summary:", error);

      if (error.response?.status === 403) {
        const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.response?.data?.message || 'You do not have permission to view activity summary.';
        setActivityLogsDenied(true);
        setActivityLogsDeniedMsg(errorMessage);
        return;
      }

      setActivitySummary(null);
    }
  };

  // Trigger fetches when filters or pages change
  useEffect(() => {
    if (activeTab === "relations") {
      fetchFixedRelations(fixedPage, searchTerm);
    } else if (activeTab === "overrides") {
      fetchOverrides(overridePage, searchTerm);
    }
  }, [fixedPage, overridePage, searchTerm, filterCategory, filterlifestyle, filterfamilyname8, filterDistrict, activeTab]);

  // Reset pages when filters change
  useEffect(() => {
    setFixedPage(1);
  }, [searchTerm, filterCategory]);

  useEffect(() => {
    setOverridePage(1);
  }, [searchTerm, filterlifestyle, filterfamilyname8, filterDistrict]);

  const fetchOverrideFilters = async () => {
    try {
      console.log('Fetching override filters...');
      const [lifestyleRes, familyname8Res, districtRes] = await Promise.all([
        api.get("api/admin/profile-overrides/?lifestyle"),
        api.get("api/admin/profile-overrides/?familyname8"),
        api.get("api/admin/profile-overrides/?district"),
      ]);

      const extractUnique = (data: any, field: string) => {
        let items = data;
        if (data && typeof data === "object") {
          if (Array.isArray(data.results)) items = data.results;
          else if (Array.isArray(data.data)) items = data.data;
          else if (!Array.isArray(data)) items = [];
        } else {
          items = [];
        }

        const values = items
          .map((item: any) => item[field])
          .filter((val: any) => val && typeof val === "string");
        return Array.from(new Set(values)) as string[];
      };

      setOverridelifestyles(extractUnique(lifestyleRes.data, "lifestyle"));
      setOverridefamilyname8s(
        extractUnique(familyname8Res.data, "familyname8")
      );
      setOverrideDistricts(extractUnique(districtRes.data, "district"));
    } catch (error: any) {
      console.error("Error fetching override filters:", error);

      if (error.response?.status === 403) {
        const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.response?.data?.message || 'You do not have permission to perform this action.';
        setAccessDenied(true);
        setAccessDeniedMessage(errorMessage);
        return;
      }
    }
  };

  const handleCreateRelation = async () => {
    setCreateRelationError('');
    try {
      toast.loading("Creating relation...");
      
      const response = await api.post(
        "api/admin/fixed-relations/",
        newRelation
      );
      
      toast.dismiss();
      
      if (response.status === 201 || response.status === 200) {
        toast.success("Relation created successfully");
        setShowCreateModal(false);
        setCreateRelationError('');
        setNewRelation({
          relation_code: "",
          default_english: "",
          default_tamil: "",
          match_token: "",
          composition_token: "",
        });
        await fetchFixedRelations(1, searchTerm);
        await fetchActivitySummary();
        await fetchInverseMappings();
      } else {
        const msg = "Failed to create relation";
        setCreateRelationError(msg);
        toast.error(msg);
      }
    } catch (error: any) {
      toast.dismiss();
      console.error("Error creating relation:", error);

      console.log('Error response data:', error.response?.data);

      if (error.response?.status === 400) {
        const errorData = error.response.data;

        if (errorData?.errors?.relation_code) {
          const msg = errorData.errors.relation_code[0];
          setCreateRelationError(msg);
          toast.error(msg);
          return;
        }

        if (errorData?.relation_code) {
          const msg = errorData.relation_code[0];
          setCreateRelationError(msg);
          toast.error(msg);
          return;
        }

        if (errorData?.detail || errorData?.message) {
          const msg = errorData.detail || errorData.message;
          setCreateRelationError(msg);
          toast.error(msg);
          return;
        }
      }

      const msg = "Failed to create relation";
      setCreateRelationError(msg);
      toast.error(msg);
    }
  };

  const handleCreateOverride = async () => {
    try {
      toast.loading("Creating override...");
      
      const payload: any = {
        relation_code: newOverride.relation_code,
        language: newOverride.language,
        label: newOverride.label,
      };

      if (newOverride.lifestyle) payload.lifestyle = newOverride.lifestyle;
      if (newOverride.familyname8)
        payload.familyname8 = newOverride.familyname8;
      if (newOverride.family) payload.family = newOverride.family;
      if (newOverride.native) payload.native = newOverride.native;
      if (newOverride.present_city)
        payload.present_city = newOverride.present_city;
      if (newOverride.taluk) payload.taluk = newOverride.taluk;
      if (newOverride.district) payload.district = newOverride.district;
      if (newOverride.state) payload.state = newOverride.state;
      if (newOverride.nationality)
        payload.nationality = newOverride.nationality;

      const response = await api.post("api/admin/profile-overrides/", payload);
      
      toast.dismiss();
      
      if (response.status === 201 || response.status === 200) {
        toast.success("Override created successfully");
        setShowOverrideModal(false);
        setNewOverride({
          relation_code: "",
          language: "",
          lifestyle: "",
          familyname8: "",
          family: "",
          native: "",
          present_city: "",
          taluk: "",
          district: "",
          state: "",
          nationality: "",
          label: "",
        });
        await fetchOverrides(1, searchTerm);
        await fetchActivitySummary();
      } else {
        toast.error("Failed to create override");
      }
    } catch (error: any) {
      toast.dismiss();
      console.error("Error creating override:", error);
      toast.error(error.response?.data?.message || "Failed to create override");
    }
  };

  const handleUpdateOverride = async () => {
    if (!editingOverride) return;

    try {
      toast.loading("Updating override...");
      
      const payload: any = {
        relation_code: editingOverride.relation_code,
        language: editingOverride.language,
        label: editingOverride.label,
      };

      if (editingOverride.lifestyle)
        payload.lifestyle = editingOverride.lifestyle;
      if (editingOverride.familyname8)
        payload.familyname8 = editingOverride.familyname8;
      if (editingOverride.family) payload.family = editingOverride.family;
      if (editingOverride.native) payload.native = editingOverride.native;
      if (editingOverride.present_city)
        payload.present_city = editingOverride.present_city;
      if (editingOverride.taluk) payload.taluk = editingOverride.taluk;
      if (editingOverride.district) payload.district = editingOverride.district;
      if (editingOverride.state) payload.state = editingOverride.state;
      if (editingOverride.nationality)
        payload.nationality = editingOverride.nationality;

      const response = await api.put(
        `api/admin/profile-overrides/${editingOverride.id}/`,
        payload
      );
      
      toast.dismiss();
      
      if (response.status === 200) {
        toast.success("Override updated successfully");
        setEditingOverride(null);
        setShowOverrideModal(false);
        await fetchOverrides(overridePage, searchTerm);
        await fetchActivitySummary();
      } else {
        toast.error("Failed to update override");
      }
    } catch (error: any) {
      toast.dismiss();
      console.error("Error updating override:", error);
      toast.error(error.response?.data?.message || "Failed to update override");
    }
  };

  const handleDeleteOverride = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this override? This action cannot be undone."))
      return;
  
    try {
      toast.loading("Deleting override...");
  
      const response = await api.delete(`api/admin/profile-overrides/${id}/`);
  
      toast.dismiss();
  
      if (response.status === 200 || response.status === 204) {
        toast.success("Override deleted successfully!");
        
        setOverrides((prevOverrides) =>
          prevOverrides.filter((override) => override.id !== id)
        );
        
        await fetchOverrides(overridePage, searchTerm);
        await fetchActivitySummary();
      } else {
        toast.error("Failed to delete override");
      }
    } catch (error: any) {
      toast.dismiss();
      console.error("Error deleting override:", error);
      toast.error("Error deleting override: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDuplicate = (item: any) => {
    if ("default_english" in item) {
      setNewOverride({
        relation_code: item.relation_code,
        language: "ta",
        lifestyle: "",
        familyname8: "",
        family: "",
        native: "",
        present_city: "",
        taluk: "",
        district: "",
        state: "",
        nationality: "",
        label: item.default_tamil,
      });
      setEditingOverride(null);
      setShowOverrideModal(true);
    } else {
      setNewOverride({
        relation_code: item.relation_code,
        language: item.language,
        lifestyle: item.lifestyle || "",
        familyname8: item.familyname8 || "",
        family: item.family || "",
        native: item.native || "",
        present_city: item.present_city || "",
        taluk: item.taluk || "",
        district: item.district || "",
        state: item.state || "",
        nationality: item.nationality || "",
        label: `${item.label} (Copy)`,
      });
      setEditingOverride(null);
      setShowOverrideModal(true);
      toast.success("Override duplicated successfully!");
    }
  };

  const handleDeleteFixedRelation = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this fixed relation? This may affect existing overrides. This action cannot be undone.")) {
      return;
    }
  
    try {
      toast.loading("Deleting relation...");
  
      const response = await api.delete(`api/admin/fixed-relations/${id}/`);
  
      toast.dismiss();
  
      if (response.status === 200 || response.status === 204) {
        toast.success("Relation deleted successfully!");
        
        // Remove from local state immediately
        setFixedRelations((prev) => prev.filter((rel) => rel.id !== id));
        
        // Refresh from server with current page
        await fetchFixedRelations(fixedPage, searchTerm);
        await fetchActivitySummary();
        await fetchInverseMappings();
      } else {
        toast.error("Failed to delete relation");
      }
    } catch (error: any) {
      toast.dismiss();
      console.error("Error deleting relation:", error);
      toast.error("Error deleting relation: " + (error.response?.data?.message || error.message));
    }
  };

  const performDeleteFixedRelation = async (id: number) => {
    try {
      toast.loading("Deleting relation...");

      const response = await api.delete(`api/admin/fixed-relations/${id}/`);

      toast.dismiss();

      if (response.status === 200 || response.status === 204) {
        toast.success("Relation deleted successfully!");
        
        setFixedRelations((prev) => prev.filter((rel) => rel.id !== id));
        
        await fetchFixedRelations(fixedPage, searchTerm);
        await fetchActivitySummary();
        await fetchInverseMappings();
      } else {
        toast.error("Failed to delete relation");
      }
    } catch (error: any) {
      toast.dismiss();
      console.error("Error deleting relation:", error);
      toast.error("Error deleting relation: " + (error.response?.data?.message || error.message));
    }
  };

  // Search suggestions functions
  const searchfamilyname8s = async (query: string) => {
    try {
      const response = await api.get(
        "api/admin/relation-suggest/familyname8/",
        {
          params: { q: query, limit: 5 },
        }
      );
      return response.data.suggestions || [];
    } catch (error) {
      return [];
    }
  };

  const searchFamilies = async (query: string) => {
    try {
      const response = await api.get("api/admin/relation-suggest/family/", {
        params: { q: query, limit: 5 },
      });
      return response.data.suggestions || [];
    } catch (error) {
      return [];
    }
  };

  const searchRelations = async (query: string) => {
    try {
      const response = await api.get("api/admin/relation-suggest/relation/", {
        params: { q: query, limit: 5 },
      });
      return response.data.suggestions || [];
    } catch (error) {
      return [];
    }
  };

  const searchNatives = async (query: string) => {
    try {
      const response = await api.get("api/admin/relation-suggest/native/", {
        params: { q: query, limit: 5 },
      });
      return response.data.suggestions || [];
    } catch (error) {
      return [];
    }
  };

  const searchCities = async (query: string) => {
    try {
      const response = await api.get("api/admin/relation-suggest/city/", {
        params: { q: query, limit: 5 },
      });
      return response.data.suggestions || [];
    } catch (error) {
      return [];
    }
  };

  const searchTaluks = async (query: string) => {
    try {
      const response = await api.get("api/admin/relation-suggest/taluk/", {
        params: { q: query, limit: 5 },
      });
      return response.data.suggestions || [];
    } catch (error) {
      return [];
    }
  };

  const searchDistricts = async (query: string) => {
    try {
      const response = await api.get("api/admin/relation-suggest/district/", {
        params: { q: query, limit: 5 },
      });
      return response.data.suggestions || [];
    } catch (error) {
      return [];
    }
  };

  const refreshActivityLogs = async (filters?: any) => {
    await fetchActivityLogs(filters);
    await fetchActivitySummary();
    toast.success("Activity logs refreshed");
  };

  const handleEditFixedRelation = (relation: FixedRelation) => {
    setShowEditModal(relation);
  };

  const handleEditComplete = async () => {
    await fetchFixedRelations(fixedPage, searchTerm);
    await fetchActivitySummary();
    await fetchInverseMappings();
  };

  console.log('Rendering main RelationManagement UI');

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Network className="w-8 h-8 text-red-600" />
            Relation Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage relationship definitions, overrides, and track changes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingOverride(null);
              setShowOverrideModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Override
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            CREATE RELATION
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("relations")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "relations"
              ? "border-red-500 text-red-600 dark:text-red-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Fixed Relations {fixedRelationsDenied ? '(Denied)' : `(${fixedRelations.length})`}
            </div>
          </button>
          <button
            onClick={() => setActiveTab("overrides")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "overrides"
              ? "border-red-500 text-red-600 dark:text-red-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Overrides {overridesDenied ? '(Denied)' : `(${overrides.length})`}
            </div>
          </button>
          <button
            onClick={() => setActiveTab("inverse")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "inverse"
              ? "border-red-500 text-red-600 dark:text-red-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
          >
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Inverse Relations {inverseMappingsDenied ? '(Denied)' : `(${inverseMappings.length})`}
            </div>
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "activity"
              ? "border-red-500 text-red-600 dark:text-red-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Activity Logs
            </div>
          </button>
        </nav>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Relations
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {fixedRelationsDenied ? <span className="text-xs text-red-500 font-normal">Access Denied</span> : fixedRelations.length}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Network className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Overrides
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {overridesDenied ? <span className="text-xs text-red-500 font-normal">Access Denied</span> : overrides.length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Layers className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Today's Activity
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {activityLogsDenied ? <span className="text-xs text-red-500 font-normal">Access Denied</span> : (activitySummary?.today || 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <History className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Inverse Mappings
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {inverseMappingsDenied ? <span className="text-xs text-red-500 font-normal">Access Denied</span> : inverseMappings.length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <GitBranch className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === "relations" && (
        fixedRelationsDenied ? (
          <PermissionDenied message={fixedRelationsDeniedMsg} />
        ) : (
          <FixedRelationsTable
            relations={fixedRelations}
            totalRelations={totalFixedRelations}
            currentPage={fixedPage}
            onPageChange={setFixedPage}
            searchTerm={searchTerm}
            filterCategory={filterCategory}
            onDelete={handleDeleteFixedRelation}
            onEdit={handleEditFixedRelation}
            onView={(item: any) => setViewingItem(item)}
            onDuplicate={handleDuplicate}
            onRefresh={() => fetchFixedRelations(fixedPage, searchTerm)}
          />
        )
      )}

      {activeTab === "overrides" && (
        overridesDenied ? (
          <PermissionDenied message={overridesDeniedMsg} />
        ) : (
          <OverridesTable
            overrides={overrides}
            totalOverrides={totalOverrides}
            currentPage={overridePage}
            onPageChange={setOverridePage}
            searchTerm={searchTerm}
            onDelete={handleDeleteOverride}
            onEdit={(override: RelationOverride) => {
              setEditingOverride(override);
              setShowOverrideModal(true);
            }}
            onView={(item: any) => setViewingItem(item)}
            onDuplicate={handleDuplicate}
            onRefresh={() => fetchOverrides(overridePage, searchTerm)}
          />
        )
      )}

      {activeTab === "inverse" && (
        inverseMappingsDenied ? (
          <PermissionDenied message={inverseMappingsDeniedMsg} />
        ) : (
          <InverseRelationsContent
            inverseMappings={inverseMappings}
            onUpdateInverse={updateInverseRelation}
            onRefresh={fetchInverseMappings}
            loading={inverseLoading}
          />
        )
      )}

      {activeTab === "activity" && (
        activityLogsDenied ? (
          <PermissionDenied message={activityLogsDeniedMsg} />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <ActivityLogsContent
              logs={activityLogs}
              summary={activitySummary}
              onClose={() => setActiveTab("relations")}
              onRefresh={refreshActivityLogs}
              onFilter={refreshActivityLogs}
            />
          </div>
        )
      )}

      {/* Create Relation Modal */}
      {showCreateModal && (
        <CreateRelationModal
          onClose={() => { setShowCreateModal(false); setCreateRelationError(''); }}
          onSubmit={handleCreateRelation}
          relation={newRelation}
          onChange={(val: any) => { setCreateRelationError(''); setNewRelation(val); }}
          categoryOptions={categoryOptions}
          errorMessage={createRelationError}
        />
      )}

      {/* Create/Edit Override Modal */}
      {showOverrideModal && (
        <CreateOverrideModal
          onClose={() => {
            setShowOverrideModal(false);
            setEditingOverride(null);
          }}
          onSubmit={
            editingOverride ? handleUpdateOverride : handleCreateOverride
          }
          override={editingOverride || newOverride}
          onChange={editingOverride ? setEditingOverride : setNewOverride}
          suggestions={suggestions}
          onSearchfamilyname8={searchfamilyname8s}
          onSearchFamily={searchFamilies}
          onSearchRelation={searchRelations}
          onSearchNative={searchNatives}
          onSearchCity={searchCities}
          onSearchTaluk={searchTaluks}
          onSearchDistrict={searchDistricts}
          languageOptions={languageOptions}
          isEditing={!!editingOverride}
        />
      )}

      {/* Edit Relation Modal */}
      {showEditModal && (
        <EditRelationModal
          onClose={() => setShowEditModal(null)}
          relation={showEditModal}
          onChange={setShowEditModal}
          categoryOptions={categoryOptions}
          onRefresh={handleEditComplete}
        />
      )}

      {/* View Details Modal */}
      {viewingItem && (
        <ViewDetailsModal
          item={viewingItem}
          onClose={() => setViewingItem(null)}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => {
          setConfirmModal({ ...confirmModal, isOpen: false });
          toast.success('Action cancelled');
        }}
        onConfirm={() => {
          if (confirmModal.id) {
            confirmModal.onConfirm(confirmModal.id);
          }
          setConfirmModal({ ...confirmModal, isOpen: false });
        }}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
}

const ViewDetailsModal = ({ onClose, item }: any) => {
  if (!item) return null;

  const isFixedRelation = "default_english" in item;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-60 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {isFixedRelation ? "Relation Details" : "Override Details"}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Full record properties and values
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <XCircle className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(item).map(([key, value]) => (
              <div key={key} className="group">
                <label className="block text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-1 opacity-70">
                  {key.replace(/_/g, " ")}
                </label>
                <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  <span className="text-sm font-medium text-gray-900 dark:text-white break-all">
                    {value === null || value === undefined || value === "" ? (
                      <span className="text-gray-300 italic">Not set</span>
                    ) : (
                      String(value)
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end bg-gray-50/50 dark:bg-gray-900/50">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Sub-components
const FixedRelationsTable = ({
  relations,
  totalRelations,
  currentPage,
  onPageChange,
  searchTerm,
  filterCategory,
  onDelete,
  onEdit,
  onView,
  onDuplicate,
  onRefresh,
}: any) => {
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalRelations / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRelations = relations;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Fixed Relations ({totalRelations})
        </h3>
        <button
          onClick={onRefresh}
          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <th className="sticky left-0 z-20 py-3.5 px-4 text-left font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800">
                Relation Code
              </th>
              <th className="py-3.5 px-4 text-left font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight whitespace-nowrap">
                Default English
              </th>
              <th className="py-3.5 px-4 text-left font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight whitespace-nowrap">
                Default Tamil
              </th>
              <th className="py-3.5 px-4 text-left font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight whitespace-nowrap">
                Updated At
              </th>
              <th className="sticky right-0 z-20 py-3.5 px-4 text-center font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight bg-gray-50 dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800">
                Actions
              </th>
             </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {paginatedRelations.map((relation: FixedRelation) => (
              <tr
                key={relation.id}
                className="hover:bg-gray-50/50 dark:hover:bg-gray-900/40 transition-colors"
              >
                <td className="sticky left-0 z-10 py-3 px-4 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-800 font-mono font-bold text-red-600 dark:text-red-400">
                  {relation.relation_code}
                </td>
                <td className="py-3 px-4 text-gray-900 dark:text-white whitespace-nowrap">
                  {relation.default_english || "—"}
                </td>
                <td className="py-3 px-4 text-gray-900 dark:text-white whitespace-nowrap font-tamil">
                  {relation.default_tamil || "—"}
                </td>
                <td className="py-3 px-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {new Date(relation.updated_at).toLocaleDateString()}
                </td>
                <td className="sticky right-0 z-10 py-3 px-2 bg-white dark:bg-gray-800 border-l border-gray-100 dark:border-gray-800 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onView(relation)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      title="View"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEdit(relation)}
                      className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDuplicate(relation)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      title="Duplicate"
                    >
                      <IoDuplicate className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(relation.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/30 flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Showing <span className="font-bold">{startIndex + 1}</span> to{" "}
          <span className="font-bold">
            {Math.min(startIndex + itemsPerPage, totalRelations)}
          </span>{" "}
          of <span className="font-bold">{totalRelations}</span> results
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 border border-red-100 dark:border-red-900/30 rounded-lg disabled:opacity-30 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 px-2">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 border border-red-100 dark:border-red-900/30 rounded-lg disabled:opacity-30 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const OverridesTable = ({
  overrides,
  totalOverrides,
  currentPage,
  onPageChange,
  searchTerm,
  onDelete,
  onEdit,
  onView,
  onDuplicate,
  onRefresh,
}: any) => {
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalOverrides / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOverrides = overrides;

  const getSpecificityBadge = (score: number) => {
    let color = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    if (score >= 8) {
      color =
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    } else if (score >= 5) {
      color =
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    } else if (score >= 3) {
      color =
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    }
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${color}`}
      >
        SC: {score}
      </span>
    );
  };

  const getLanguageBadge = (language: string) => {
    return (
      <span
        className={`px-2 py-0.5 text-[10px] font-black rounded-full flex items-center gap-1 uppercase tracking-tight ${language === "ta"
          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          }`}
      >
        {language === "ta" ? "தமிழ்" : "ENG"}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Overrides ({totalOverrides})
          </h3>
        </div>
        <button
          onClick={onRefresh}
          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
        {overrides.length === 0 ? (
          <div className="text-center py-12">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No matches found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th className="sticky left-0 z-20 py-3.5 px-4 text-left font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800">
                  Relation
                </th>
                <th className="py-3.5 px-4 text-left font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight whitespace-nowrap">
                  LANG
                </th>
                <th className="py-3.5 px-4 text-left font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight whitespace-nowrap">
                  lifestyle/familyname8
                </th>
                <th className="py-3.5 px-4 text-left font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight whitespace-nowrap">
                  Location
                </th>
                <th className="py-3.5 px-4 text-left font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight whitespace-nowrap">
                  Label
                </th>
                <th className="py-3.5 px-4 text-left font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight whitespace-nowrap">
                  Score
                </th>
                <th className="sticky right-0 z-20 py-3.5 px-4 text-center font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight bg-gray-50 dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginatedOverrides.map((override: RelationOverride) => (
                <tr
                  key={override.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-900/40 transition-colors"
                >
                  <td className="sticky left-0 z-10 py-3 px-4 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-800">
                    <span className="font-mono font-bold text-red-600 dark:text-red-400">
                      {override.relation_code}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {getLanguageBadge(override.language)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-[11px] leading-tight space-y-0.5">
                      {override.lifestyle && (
                        <div>
                          <span className="font-bold opacity-60">REL:</span>{" "}
                          {override.lifestyle}
                        </div>
                      )}
                      {override.familyname8 && (
                        <div>
                          <span className="font-bold opacity-60">CST:</span>{" "}
                          {override.familyname8}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-[11px] leading-tight flex items-center gap-1 text-gray-500 whitespace-nowrap">
                      <MapPin className="w-3 h-3" />
                      {override.native || override.district || "Global"}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {override.label}
                  </td>
                  <td className="py-3 px-4">
                    {getSpecificityBadge(override.specificity_score)}
                  </td>
                  <td className="sticky right-0 z-10 py-3 px-2 bg-white dark:bg-gray-800 border-l border-gray-100 dark:border-gray-800 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onView(override)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        title="View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEdit(override)}
                        className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDuplicate(override)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        title="Duplicate"
                      >
                        <IoDuplicate className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(override.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/30 flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Showing <span className="font-bold">{startIndex + 1}</span> to{" "}
          <span className="font-bold">
            {Math.min(startIndex + itemsPerPage, totalOverrides)}
          </span>{" "}
          of <span className="font-bold">{totalOverrides}</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 border border-red-100 dark:border-red-900/30 rounded-lg disabled:opacity-30 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 px-2">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 border border-red-100 dark:border-red-900/30 rounded-lg disabled:opacity-30 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal Components
const CreateRelationModal = ({
  onClose,
  onSubmit,
  relation,
  onChange,
  categoryOptions,
  errorMessage,
}: any) => {
  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create New Relation
          </h3>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Relation Code *
                </label>
                <input
                  type="text"
                  value={relation.relation_code}
                  onChange={(e) =>
                    onChange({
                      ...relation,
                      relation_code: e.target.value.toUpperCase(),
                      match_token: e.target.value.toUpperCase(),
                      composition_token: relation.default_english ? relation.default_english.toUpperCase() : '',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-900"
                  placeholder="e.g., FATHER"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Tamil *
                </label>
                <input
                  type="text"
                  value={relation.default_tamil}
                  onChange={(e) =>
                    onChange({ ...relation, default_tamil: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-900"
                  placeholder="e.g., தந்தை"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default English *
                </label>
                <input
                  type="text"
                  value={relation.default_english}
                  onChange={(e) =>
                    onChange({
                      ...relation,
                      default_english: e.target.value,
                      composition_token: e.target.value.toUpperCase()
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-900"
                  placeholder="e.g., Father"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-red-700 dark:text-red-300 font-medium">{errorMessage}</span>
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Create Relation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full shadow-2xl animate-fade-in">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditRelationModal = ({
  onClose,
  relation,
  onChange,
  categoryOptions,
  onRefresh,
}: any) => {
  const handleSubmit = async () => {
    try {
      toast.loading("Updating relation...");
      
      const updatedRelation = {
        ...relation,
        match_token: relation.relation_code?.toUpperCase() || '',
        composition_token: relation.default_english?.toUpperCase() || '',
      };

      const response = await api.put(
        `api/admin/fixed-relations/${relation.id}/`,
        updatedRelation
      );
      
      toast.dismiss();
      
      if (response.status === 200) {
        toast.success("Relation updated successfully");
        if (onRefresh) {
          await onRefresh();
        }
        onClose();
      } else {
        toast.error("Failed to update relation");
      }
    } catch (error: any) {
      toast.dismiss();
      console.error("Error updating relation:", error);
      toast.error(error.response?.data?.message || "Failed to update relation");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Relation
          </h3>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Relation Code *
            </label>
            <input
              type="text"
              value={relation.relation_code}
              onChange={(e) =>
                onChange({
                  ...relation,
                  relation_code: e.target.value.toUpperCase(),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-900"
              placeholder="e.g., FATHER"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default English *
            </label>
            <input
              type="text"
              value={relation.default_english}
              onChange={(e) =>
                onChange({ ...relation, default_english: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-900"
              placeholder="e.g., Father"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Tamil *
            </label>
            <input
              type="text"
              value={relation.default_tamil}
              onChange={(e) =>
                onChange({ ...relation, default_tamil: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-900"
              placeholder="e.g., தந்தை"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Update Relation
          </button>
        </div>
      </div>
    </div>
  );
};

const CreateOverrideModal = ({
  onClose,
  onSubmit,
  override,
  onChange,
  suggestions,
  onSearchfamilyname8,
  onSearchFamily,
  onSearchRelation,
  onSearchNative,
  onSearchCity,
  onSearchTaluk,
  onSearchDistrict,
  languageOptions,
  isEditing,
}: any) => {
  const [familyname8Suggestions, setfamilyname8Suggestions] = useState<any[]>(
    []
  );
  const [familySuggestions, setFamilySuggestions] = useState<any[]>([]);
  const [relationSuggestions, setRelationSuggestions] = useState<any[]>([]);
  const [nativeSuggestions, setNativeSuggestions] = useState<any[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [talukSuggestions, setTalukSuggestions] = useState<any[]>([]);
  const [districtSuggestions, setDistrictSuggestions] = useState<any[]>([]);

  const handlefamilyname8Search = async (query: string) => {
    if (query.length >= 2) {
      const results = await onSearchfamilyname8(query);
      setfamilyname8Suggestions(results);
    }
  };

  const handleFamilySearch = async (query: string) => {
    if (query.length >= 2) {
      const results = await onSearchFamily(query);
      setFamilySuggestions(results);
    }
  };

  const handleRelationSearch = async (query: string) => {
    if (query.length >= 2) {
      const results = await onSearchRelation(query);
      setRelationSuggestions(results);
    }
  };

  const handleNativeSearch = async (query: string) => {
    if (query.length >= 2) {
      const results = await onSearchNative(query);
      setNativeSuggestions(results);
    }
  };

  const handleCitySearch = async (query: string) => {
    if (query.length >= 2) {
      const results = await onSearchCity(query);
      setCitySuggestions(results);
    }
  };

  const handleTalukSearch = async (query: string) => {
    if (query.length >= 2) {
      const results = await onSearchTaluk(query);
      setTalukSuggestions(results);
    }
  };

  const handleDistrictSearch = async (query: string) => {
    if (query.length >= 2) {
      const results = await onSearchDistrict(query);
      setDistrictSuggestions(results);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? "Edit Relation Override" : "Create Relation Override"}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Required Fields Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Required Fields
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Relation Code *
                  </label>
                  <input
                    type="text"
                    value={override.relation_code}
                    onChange={(e) => {
                      onChange({
                        ...override,
                        relation_code: e.target.value.toUpperCase(),
                      });
                      handleRelationSearch(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-900"
                    placeholder="e.g., FATHER"
                    list="relation-suggestions"
                  />
                  <datalist id="relation-suggestions">
                    {relationSuggestions.map((suggestion) => (
                      <option key={suggestion.value} value={suggestion.value}>
                        {suggestion.label}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language *
                  </label>
                  <select
                    value={override.language}
                    onChange={(e) =>
                      onChange({ ...override, language: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-900"
                  >
                    <option value="">Select Language</option>
                    {languageOptions.map((option: any) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Custom Label *
                  </label>
                  <input
                    type="text"
                    value={override.label}
                    onChange={(e) =>
                      onChange({ ...override, label: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-900"
                    placeholder="e.g., தந்தை (பிராமணர்)"
                  />
                </div>
              </div>
            </div>

            {/* Demographic Fields Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Demographic Information (Optional)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Life Style
                  </label>
                  <input
                    type="text"
                    value={override.lifestyle || ""}
                    onChange={(e) =>
                      onChange({ ...override, lifestyle: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-900"
                    placeholder="e.g., Hindu"
                    list="lifestyle-suggestions"
                  />
                  <datalist id="lifestyle-suggestions">
                    {suggestions?.lifestyles?.map((lifestyle: string) => (
                      <option key={lifestyle} value={lifestyle}>
                        {lifestyle}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Family Name 1
                  </label>
                  <input
                    type="text"
                    value={override.familyname8 || ""}
                    onChange={(e) => {
                      onChange({ ...override, familyname8: e.target.value });
                      handlefamilyname8Search(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-900"
                    placeholder="Start typing familyname8 name..."
                    list="familyname8-suggestions"
                  />
                  <datalist id="familyname8-suggestions">
                    {familyname8Suggestions.map((suggestion) => (
                      <option key={suggestion.value} value={suggestion.value}>
                        {suggestion.label}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Family Name 2
                  </label>
                  <input
                    type="text"
                    value={override.family || ""}
                    onChange={(e) => {
                      onChange({ ...override, family: e.target.value });
                      handleFamilySearch(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-900"
                    placeholder="Start typing family name..."
                    list="family-suggestions"
                  />
                  <datalist id="family-suggestions">
                    {familySuggestions.map((suggestion) => (
                      <option key={suggestion.value} value={suggestion.value}>
                        {suggestion.label}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            {/* Location Fields Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Location Details (Optional)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Native Place
                  </label>
                  <input
                    type="text"
                    value={override.native || ""}
                    onChange={(e) => {
                      onChange({ ...override, native: e.target.value });
                      handleNativeSearch(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-900"
                    placeholder="e.g., Karaikudi"
                    list="native-suggestions"
                  />
                  <datalist id="native-suggestions">
                    {nativeSuggestions.map((suggestion) => (
                      <option key={suggestion.value} value={suggestion.value}>
                        {suggestion.label}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Present City
                  </label>
                  <input
                    type="text"
                    value={override.present_city || ""}
                    onChange={(e) => {
                      onChange({ ...override, present_city: e.target.value });
                      handleCitySearch(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-900"
                    placeholder="e.g., Chennai"
                    list="city-suggestions"
                  />
                  <datalist id="city-suggestions">
                    {citySuggestions.map((suggestion) => (
                      <option key={suggestion.value} value={suggestion.value}>
                        {suggestion.label}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Taluk
                  </label>
                  <input
                    type="text"
                    value={override.taluk || ""}
                    onChange={(e) => {
                      onChange({ ...override, taluk: e.target.value });
                      handleTalukSearch(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-900"
                    placeholder="e.g., Tirupattur"
                    list="taluk-suggestions"
                  />
                  <datalist id="taluk-suggestions">
                    {talukSuggestions.map((suggestion) => (
                      <option key={suggestion.value} value={suggestion.value}>
                        {suggestion.label}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    District
                  </label>
                  <input
                    type="text"
                    value={override.district || ""}
                    onChange={(e) => {
                      onChange({ ...override, district: e.target.value });
                      handleDistrictSearch(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-900"
                    placeholder="e.g., Sivaganga"
                    list="district-suggestions"
                  />
                  <datalist id="district-suggestions">
                    {districtSuggestions.map((suggestion) => (
                      <option key={suggestion.value} value={suggestion.value}>
                        {suggestion.label}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={override.state || ""}
                    onChange={(e) =>
                      onChange({ ...override, state: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-900"
                    placeholder="e.g., Tamil Nadu"
                    list="state-suggestions"
                  />
                  <datalist id="state-suggestions">
                    {suggestions?.states?.map((state: string) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nationality
                  </label>
                  <input
                    type="text"
                    value={override.nationality || ""}
                    onChange={(e) =>
                      onChange({ ...override, nationality: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-900"
                    placeholder="e.g., Indian"
                    list="nationality-suggestions"
                  />
                  <datalist id="nationality-suggestions">
                    {suggestions?.nationalities?.map((nationality: string) => (
                      <option key={nationality} value={nationality}>
                        {nationality}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            {isEditing ? "Update Override" : "Create Override"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Export alias for backward compatibility with routes.tsx
export { RelationManagement as FamilyManagement };