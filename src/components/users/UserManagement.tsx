import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  UserCheck,
  UserX,
  UserMinus,
  Users,
  UserPlus,
  Activity,
  RefreshCw,
  Calendar,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface User {
  id: number;
  mobile_number: string;
  email: string;
  is_active: boolean;
  is_mobile_verified: boolean;
  created_at: string;
  last_login: string;
  name: string;
  user_type?: 'regular' | 'admin' | 'staff';
}

interface UserStats {
  total_users: number;
  admin_count: number;
  staff_count: number;
  regular_users: number;
  active_users: number;
  inactive_users: number;
  today_new_users: number;
  week_new_users: number;
  timestamp: string;
}

export function UserManagement() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [viewLoading, setViewLoading] = useState<number | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch users and stats
  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  // Fetch users with filters
  const fetchUsers = async () => {
    try {
      setLoading(true);
      let url = '/api/admin/users/';
      const params = new URLSearchParams();

      params.append('page', currentPage.toString());
      params.append('page_size', rowsPerPage.toString());

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await api.get(`${url}?${params.toString()}`);

      // Defensive handling of different response formats
      const data = response.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setUsers(data.results || []);
        setTotalUsers(data.count || 0);
      } else if (Array.isArray(data)) {
        setUsers(data);
        setTotalUsers(data.length);
      } else {
        setUsers([]);
        setTotalUsers(0);
      }
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      if (error.response?.status === 403) {
        setAccessDenied(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch user statistics
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await api.get('/api/admin/users/stats/');
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
      if (error.response?.status === 403) {
        setAccessDenied(true);
      }
    } finally {
      setStatsLoading(false);
    }
  };

  // Handle search and filter changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, statusFilter, rowsPerPage, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Handle view user
  const handleViewUser = async (userId: number) => {
    try {
      setViewLoading(userId);
      const response = await api.get(`/api/admin/users/${userId}/`);

      // Remove specific fields from the response
      const filteredUser = { ...response.data };
      delete filteredUser.email;
      delete filteredUser.user_type;
      delete filteredUser.is_mobile_verified;
      delete filteredUser.is_admin_staff;
      delete filteredUser.last_login;

      setViewingUser(filteredUser);
    } catch (error: any) {
      console.error('Failed to fetch user details:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch user details');
    } finally {
      setViewLoading(null);
    }
  };

  // Handle user activation/deactivation
  const handleUserStatusToggle = async (userId: number, activate: boolean) => {
    try {
      setActionLoading(userId);
      const endpoint = activate
        ? `/api/admin/users/${userId}/activate/`
        : `/api/admin/users/${userId}/deactivate/`;

      await api.post(endpoint);

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId
            ? { ...user, is_active: activate }
            : user
        )
      );

      // Refresh stats
      fetchStats();
      toast.success(`User ${activate ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      console.error('Failed to toggle user status:', error);
      toast.error(error.response?.data?.message || 'Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle multiple users activation/deactivation
  const handleBulkAction = async (activate: boolean) => {
    if (selectedUsers.length === 0) return;

    try {
      const promises = selectedUsers.map(userId =>
        activate
          ? api.post(`/api/admin/users/${userId}/activate/`)
          : api.post(`/api/admin/users/${userId}/deactivate/`)
      );

      await Promise.all(promises);

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          selectedUsers.includes(user.id)
            ? { ...user, is_active: activate }
            : user
        )
      );

      // Clear selection and refresh stats
      setSelectedUsers([]);
      fetchStats();

      toast.success(`Successfully ${activate ? 'activated' : 'deactivated'} ${selectedUsers.length} users`);
    } catch (error: any) {
      console.error('Failed to perform bulk action:', error);
      toast.error(error.response?.data?.message || 'Failed to update users status');
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  // Handle select user
  const handleSelectUser = (id: number) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter(userId => userId !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format last login
  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return formatDate(dateString);
  };

  // Get status style
  const getStatusStyle = (isActive: boolean) => {
    return isActive
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
  };

  // Pagination logic
  const totalPages = Math.ceil(totalUsers / rowsPerPage);
  const paginatedUsers = users; // Since we now use server-side pagination

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-full mb-6">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">!</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Access Denied
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          You do not have permission to view User Management.
        </p>
      </div>
    );
  }


  return (
    <div className="space-y-8 animate-fade-in p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {t('users.title') || 'User Management'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and monitor all platform users
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchUsers(); fetchStats(); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.total_users.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Users className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {stats.regular_users} regular users
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.active_users.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {Math.round((stats.active_users / stats.total_users) * 100)}% active rate
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Today's New</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.today_new_users}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <UserPlus className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {stats.week_new_users} this week
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Inactive Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.inactive_users}
                </p>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <UserMinus className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Total inactive accounts
            </p>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by mobile number or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-900"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-900"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-4 sm:gap-8 z-50 animate-fade-in border border-white/10 w-[90%] sm:w-auto">
          <span className="text-sm font-bold tracking-tight whitespace-nowrap">
            {selectedUsers.length} users selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-all whitespace-nowrap"
            >
              Activate All
            </button>
            <button
              onClick={() => handleBulkAction(false)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-all whitespace-nowrap"
            >
              Deactivate All
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th className="py-4 px-6">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                </th>
                <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User Details
                </th>
                <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Verification
                </th>
                <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Activity
                </th>
                <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                  <td className="py-4 px-6">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 flex items-center justify-center">
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.name || 'No Name'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          ID: {user.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.mobile_number}
                      </p>
                      {/* <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email || 'No email'}
                      </p> */}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${user.is_mobile_verified ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                        {user.is_mobile_verified ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        Mobile {user.is_mobile_verified ? 'Verified' : 'Not Verified'}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Joined: {formatDate(user.created_at)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Last login: {user.last_login ? formatLastLogin(user.last_login) : 'Never'}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(user.is_active)}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewUser(user.id)}
                        disabled={viewLoading === user.id}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {viewLoading === user.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      {/* <button className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button> */}
                      {user.is_active ? (
                        <button
                          onClick={() => handleUserStatusToggle(user.id, false)}
                          disabled={actionLoading === user.id}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actionLoading === user.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <UserX className="w-4 h-4" />
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUserStatusToggle(user.id, true)}
                          disabled={actionLoading === user.id}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actionLoading === user.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No users found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No users have been registered yet'}
              </p>
            </div>
          )}
        </div>

        {/* Footer & Pagination */}
        <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {Math.min(totalUsers, (currentPage - 1) * rowsPerPage + 1)} to {Math.min(totalUsers, currentPage * rowsPerPage)} of {totalUsers} users
              </p>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                {[5, 10, 25, 50].map(size => (
                  <option key={size} value={size}>{size} per page</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  // Show current page, first, last, and pages around current
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 text-xs font-bold rounded-lg transition-all ${currentPage === pageNum
                          ? 'bg-red-600 text-white shadow-lg shadow-red-200'
                          : 'hover:bg-white dark:hover:bg-gray-800 text-gray-500'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    (pageNum === currentPage - 2 && pageNum > 1) ||
                    (pageNum === currentPage + 2 && pageNum < totalPages)
                  ) {
                    return <span key={pageNum} className="text-gray-400">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              {stats?.timestamp && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Updated: {formatDate(stats.timestamp)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {viewingUser && (
        <UserDetailModal user={viewingUser} onClose={() => setViewingUser(null)} />
      )}
    </div>
  );
}

const UserDetailModal = ({ user, onClose }: { user: any; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">User Details</h3>
            <p className="text-xs text-gray-500 mt-0.5">ID: {user.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
            <XCircle className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailItem label="Name" value={user.name} />
            <DetailItem label="Mobile Number" value={user.mobile_number} />
            <DetailItem label="Active Status" value={user.is_active ? 'Active' : 'Inactive'} />
            <DetailItem label="Profile Completion" value={user.profile_completion !== undefined ? `${user.profile_completion}%` : ''} />
            <DetailItem label="Created At" value={user.created_at ? new Date(user.created_at).toLocaleString() : ''} />
          </div>

          {user.profile_info && (
            <>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-4">Profile Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailItem label="First Name" value={user.profile_info.firstname} />
                <DetailItem label="Second Name" value={user.profile_info.secondname} />
                <DetailItem label="Third Name" value={user.profile_info.thirdname} />
                <DetailItem label="Gender" value={user.profile_info.gender === 'M' ? 'Male' : user.profile_info.gender === 'F' ? 'Female' : user.profile_info.gender} />
                <DetailItem label="Date of Birth" value={user.profile_info.dateofbirth} />
                <DetailItem label="Age" value={user.profile_info.age} />
                <DetailItem label="Lifestyle" value={user.profile_info.lifestyle} />
                <DetailItem label="Family Name 8" value={user.profile_info.familyname8} />
                <DetailItem label="Present City" value={user.profile_info.present_city} />
                <DetailItem label="State" value={user.profile_info.state} />
                <DetailItem label="Nationality" value={user.profile_info.nationality} />
                <DetailItem label="Preferred Language" value={user.profile_info.preferred_language} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value }: { label: string; value: any }) => (
  <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-800">
    <label className="block text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-1 opacity-70">
      {label}
    </label>
    <span className="text-sm font-medium text-gray-900 dark:text-white break-all">
      {value === null || value === undefined || value === '' ? (
        <span className="text-gray-300 italic">Not set</span>
      ) : (
        String(value)
      )}
    </span>
  </div>
);
