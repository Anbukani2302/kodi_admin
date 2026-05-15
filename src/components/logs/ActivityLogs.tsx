import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  Clock,
  Users,
  Shield,
  User,
  LogIn,
  LogOut,
  UserPlus,
  Edit,
  Trash2,
  Key,
  ToggleLeft,
  Calendar,
  TrendingUp,
  PieChart,
  BarChart3,
  Download,
  RefreshCw,
  Globe,
  Smartphone,
  AlertCircle
} from 'lucide-react';
import { getAdminActivityLogs } from '../../services/adminServices';

/* ===== Types ===== */
interface UserInfo {
  id: number;
  mobile_number: string;
  user_type: string;
  full_name?: string;
  admin_id?: string;
  email?: string;
  is_active?: boolean;
}

interface ActivityLog {
  id: number;
  user: number;
  user_info: UserInfo;
  action: string;
  description: string;
  ip_address: string;
  user_agent: string | null;
  created_at: string;
}

interface ActionStat {
  action: string;
  count: number;
  percentage: number;
  color: string;
  icon: React.ElementType;
}

interface DailyActivity {
  date: string;
  count: number;
  day: string;
}

/* ===== Component ===== */
export function ActivityLogs() {
  const { t } = useLanguage();
  const { user, role } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  const [selectedChart, setSelectedChart] = useState<'actions' | 'users' | 'daily'>('actions');

  const isStaff = role === 'staff';
  const isAdmin = role === 'admin';

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      const res = await getAdminActivityLogs();
      console.log('Activity logs:', res.data);
      setLogs(res.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch activity logs', err);
      setError('Failed to load activity data');
    } finally {
      setLoading(false);
    }
  };

  // Filter logs based on role and time range
  const getFilteredLogs = () => {
    let filtered = logs;

    // Staff only see their own activities
    if (isStaff && user) {
      filtered = filtered.filter(log => log.user === user.id);
    }

    // Time range filter
    const now = new Date();
    if (timeRange === 'week') {
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      filtered = filtered.filter(log => new Date(log.created_at) >= weekAgo);
    } else if (timeRange === 'month') {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      filtered = filtered.filter(log => new Date(log.created_at) >= monthAgo);
    }

    return filtered;
  };

  const filteredLogs = getFilteredLogs();

  // Get action statistics
  const getActionStats = (): ActionStat[] => {
    const actionMap = new Map<string, number>();

    filteredLogs.forEach(log => {
      const count = actionMap.get(log.action) || 0;
      actionMap.set(log.action, count + 1);
    });

    const total = filteredLogs.length;
    const actionColors: Record<string, { color: string; icon: React.ElementType }> = {
      login: { color: 'from-emerald-500 to-green-500', icon: LogIn },
      logout: { color: 'from-gray-500 to-gray-600', icon: LogOut },
      create: { color: 'from-red-500 to-red-600', icon: UserPlus },
      update: { color: 'from-red-500 to-yellow-600', icon: Edit },
      delete: { color: 'from-rose-500 to-red-600', icon: Trash2 },
      password_change: { color: 'from-purple-500 to-violet-600', icon: Key },
      status_change: { color: 'from-orange-500 to-red-600', icon: ToggleLeft },
    };

    return Array.from(actionMap.entries())
      .map(([action, count]) => ({
        action,
        count,
        percentage: (count / total) * 100,
        color: actionColors[action]?.color || 'from-gray-500 to-gray-600',
        icon: actionColors[action]?.icon || Activity
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Get user type statistics
  const getUserTypeStats = () => {
    const adminCount = filteredLogs.filter(log => log.user_info?.user_type === 'admin').length;
    const staffCount = filteredLogs.filter(log => log.user_info?.user_type === 'staff').length;
    const unknownCount = filteredLogs.filter(log => log.user_info?.user_type === 'unknown' || !log.user_info?.user_type).length;
    const total = filteredLogs.length;

    return [
      {
        type: 'Admin',
        count: adminCount,
        percentage: (adminCount / total) * 100 || 0,
        color: 'from-red-500 to-rose-600',
        icon: Shield
      },
      {
        type: 'Staff',
        count: staffCount,
        percentage: (staffCount / total) * 100 || 0,
        color: 'from-red-500 to-red-600',
        icon: User
      },
      ...(unknownCount > 0 ? [{
        type: 'Unknown',
        count: unknownCount,
        percentage: (unknownCount / total) * 100 || 0,
        color: 'from-gray-500 to-gray-600',
        icon: AlertCircle
      }] : [])
    ].filter(stat => stat.count > 0);
  };

  // Get daily activity for chart
  const getDailyActivity = (): DailyActivity[] => {
    const days = 7;
    const dailyMap = new Map<string, number>();

    // Initialize last 7 days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      dailyMap.set(dateStr, 0);
    }

    filteredLogs.forEach(log => {
      const dateStr = new Date(log.created_at).toISOString().split('T')[0];
      if (dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);
      }
    });

    return Array.from(dailyMap.entries()).map(([date, count]) => ({
      date,
      count,
      day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
    }));
  };

  // Get top users
  const getTopUsers = () => {
    const userMap = new Map<string, { name: string; count: number; type: string; id: string }>();

    filteredLogs.forEach(log => {
      if (!log.user_info) return;

      const key = `${log.user}`;
      const existing = userMap.get(key) || {
        name: log.user_info.full_name || log.user_info.mobile_number || `User ${log.user}`,
        count: 0,
        type: log.user_info.user_type || 'unknown',
        id: log.user_info.admin_id || log.user_info.mobile_number || `ID-${log.user}`
      };
      userMap.set(key, { ...existing, count: existing.count + 1 });
    });

    return Array.from(userMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const actionStats = getActionStats();
  const userTypeStats = getUserTypeStats();
  const dailyActivity = getDailyActivity();
  const topUsers = getTopUsers();
  const maxDailyCount = Math.max(...dailyActivity.map(d => d.count), 1);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleExport = () => {
    const exportData = filteredLogs.map(log => ({
      Timestamp: new Date(log.created_at).toLocaleString(),
      User: log.user_info?.full_name || log.user_info?.mobile_number || `User ${log.user}`,
      'User Type': log.user_info?.user_type || 'unknown',
      'Admin ID': log.user_info?.admin_id || '-',
      Action: log.action,
      Description: log.description,
      'IP Address': log.ip_address,
      'User Agent': log.user_agent || '-'
    }));

    const csvContent = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };


  if (error) {
    return (
      <div className="flex items-center justify-center min-h-150px">
        <div className="text-center max-w-md">
          <div className="bg-rose-50 p-6 rounded-2xl inline-flex mb-6">
            <Activity className="w-12 h-12 text-rose-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to load data</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={fetchActivityLogs}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-xl bg-linear-to-br ${isAdmin ? 'from-red-500 to-rose-600' : 'from-red-500 to-red-600'
              }`}>
              {isAdmin ? (
                <Shield className="w-6 h-6 text-white" />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {isStaff ? 'My Activity' : 'Activity Analytics'}
              </h1>
              <p className="text-gray-500 flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4" />
                {filteredLogs.length} activities in selected period
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Time Range Filter */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>

          <button
            onClick={fetchActivityLogs}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExport}
            disabled={filteredLogs.length === 0}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl ${filteredLogs.length === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
              } transition-colors`}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Activities"
          value={filteredLogs.length}
          icon={Activity}
          color="from-red-600 to-red-600"
          bgColor="from-red-50 to-red-50"
        />
        <StatCard
          title="Unique Users"
          value={new Set(filteredLogs.map(l => l.user)).size}
          icon={Users}
          color="from-purple-600 to-pink-600"
          bgColor="from-purple-50 to-pink-50"
        />
        <StatCard
          title="Actions"
          value={actionStats.length}
          icon={BarChart3}
          color="from-red-600 to-orange-600"
          bgColor="from-red-50 to-orange-50"
        />
        <StatCard
          title="Active Users"
          value={topUsers.length}
          icon={TrendingUp}
          color="from-emerald-600 to-green-600"
          bgColor="from-emerald-50 to-green-50"
        />
      </div>

      {/* Chart Type Selector */}
      <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 w-fit">
        <button
          onClick={() => setSelectedChart('actions')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedChart === 'actions'
              ? 'bg-red-600 text-white shadow-lg shadow-red-200'
              : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Actions
          </div>
        </button>


      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedChart === 'actions' && 'Action Distribution'}
                {selectedChart === 'users' && 'User Activity Breakdown'}
                {selectedChart === 'daily' && 'Daily Activity Trend'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedChart === 'actions' && 'Activities grouped by action type'}
                {selectedChart === 'users' && 'Admin vs Staff activities'}
                {selectedChart === 'daily' && 'Activity volume over time'}
              </p>
            </div>
          </div>

          <div className="h-80">
            {selectedChart === 'actions' && (
              <ActionDistributionChart stats={actionStats} total={filteredLogs.length} />
            )}
            {selectedChart === 'users' && (
              <UserDistributionChart stats={userTypeStats} />
            )}
            {selectedChart === 'daily' && (
              <DailyActivityChart data={dailyActivity} maxCount={maxDailyCount} />
            )}
          </div>
        </div>

        {/* Top Users Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Top Active Users</h2>
              <p className="text-sm text-gray-500 mt-1">Most activities performed</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-red-600" />
            </div>
          </div>

          <div className="space-y-4">
            {topUsers.length > 0 ? (
              topUsers.map((user, index) => (
                <div key={user.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${index === 0 ? 'bg-linear-to-br from-yellow-400 to-red-500' :
                      index === 1 ? 'bg-linear-to-br from-gray-300 to-gray-400' :
                        index === 2 ? 'bg-linear-to-br from-orange-300 to-red-400' :
                          'bg-gray-100'
                    }`}>
                    <span className={`text-sm font-bold ${index < 3 ? 'text-white' : 'text-gray-600'
                      }`}>
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.id}</p>
                      </div>
                      <span className={`text-sm font-bold ${user.type === 'admin' ? 'text-red-600' :
                          user.type === 'staff' ? 'text-red-600' :
                            'text-gray-600'
                        }`}>
                        {user.count}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${user.type === 'admin'
                            ? 'bg-linear-to-r from-red-500 to-rose-500'
                            : user.type === 'staff'
                              ? 'bg-linear-to-r from-red-500 to-red-500'
                              : 'bg-linear-to-r from-gray-500 to-gray-600'
                          }`}
                        style={{ width: `${(user.count / topUsers[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No user activity data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activities Timeline */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
            <p className="text-sm text-gray-500 mt-1">Latest actions performed</p>
          </div>
          <span className="text-xs text-gray-400">
            Last 10 activities
          </span>
        </div>

        <div className="space-y-4">
          {filteredLogs.slice(0, 10).map((log) => {
            const ActionIcon = actionStats.find(a => a.action === log.action)?.icon || Activity;
            const actionColor = actionStats.find(a => a.action === log.action)?.color.split(' ')[0].replace('from-', '') || 'gray';

            return (
              <div key={log.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className={`p-2.5 rounded-xl bg-linear-to-br ${actionStats.find(a => a.action === log.action)?.color || 'from-gray-500 to-gray-600'}`}>
                  <ActionIcon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {log.user_info?.full_name || log.user_info?.mobile_number || `User ${log.user}`}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${log.user_info?.user_type === 'admin'
                          ? 'bg-red-100 text-red-700'
                          : log.user_info?.user_type === 'staff'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                        {log.user_info?.user_type || 'unknown'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {log.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      <span className="font-mono">{log.ip_address}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Smartphone className="w-3 h-3" />
                      <span className="truncate max-w-50">
                        {log.user_agent ? (
                          log.user_agent.includes('Windows') ? 'Windows' :
                            log.user_agent.includes('Mac') ? 'macOS' :
                              log.user_agent.includes('Linux') ? 'Linux' :
                                log.user_agent.includes('Postman') ? 'Postman' :
                                  'Unknown'
                        ) : 'Unknown'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="text-center py-16">
              <Activity className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No activities found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== Action Distribution Chart ===== */
function ActionDistributionChart({ stats, total }: { stats: ActionStat[]; total: number }) {
  if (stats.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-center h-full gap-8">
      {/* Donut Chart */}
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          {stats.map((stat, index) => {
            const offset = stats
              .slice(0, index)
              .reduce((sum, s) => sum + s.percentage, 0);
            return (
              <circle
                key={stat.action}
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={`url(#gradient-${index})`}
                strokeWidth="12"
                strokeDasharray={`${(stat.percentage * 2.51)} 251.2`}
                strokeDashoffset={-offset * 2.51}
                className="transition-all duration-500"
              />
            );
          })}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#f3f4f6"
            strokeWidth="12"
            strokeDasharray="251.2"
            strokeDashoffset="0"
          />
          <defs>
            {stats.map((stat, index) => (
              <linearGradient key={stat.action} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className={`${stat.color.split(' ')[0]}`} />
                <stop offset="100%" className={`${stat.color.split(' ')[1]}`} />
              </linearGradient>
            ))}
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{total}</span>
          <span className="text-xs text-gray-500">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {stats.slice(0, 5).map((stat, index) => (
          <div key={stat.action} className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full bg-linear-to-br ${stat.color}`} />
            <span className="text-sm text-gray-600 capitalize w-24">
              {stat.action.replace('_', ' ')}
            </span>
            <span className="text-sm font-semibold text-gray-900">{stat.count}</span>
            <span className="text-xs text-gray-500">
              ({stat.percentage.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== User Distribution Chart ===== */
function UserDistributionChart({ stats }: { stats: any[] }) {
  if (stats.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">No data available</p>
      </div>
    );
  }

  const maxCount = Math.max(...stats.map(s => s.count), 1);

  return (
    <div className="flex items-end justify-center gap-12 h-full">
      {stats.map((stat) => (
        <div key={stat.type} className="flex flex-col items-center">
          <div className="relative flex justify-center">
            <div
              className={`w-20 rounded-t-xl bg-linear-to-t ${stat.color} transition-all duration-500`}
              style={{
                height: `${Math.max((stat.count / maxCount) * 200, 40)}px`,
                minHeight: '40px'
              }}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                {stat.count}
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className={`p-2 rounded-lg bg-linear-to-br ${stat.color} bg-opacity-10 inline-block mb-2`}>
              <stat.icon className="w-5 h-5 text-gray-700" />
            </div>
            <p className="text-sm font-semibold text-gray-900">{stat.type}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stat.percentage.toFixed(1)}%
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ===== Daily Activity Chart ===== */
function DailyActivityChart({ data, maxCount }: { data: DailyActivity[]; maxCount: number }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="flex items-end justify-between h-full gap-2">
      {data.map((item, index) => {
        const height = (item.count / maxCount) * 100;
        return (
          <div key={item.date} className="flex-1 flex flex-col items-center group">
            <div className="relative w-full flex justify-center">
              <div
                className="w-full bg-linear-to-t from-red-500 to-red-500 rounded-t-lg transition-all duration-300 group-hover:from-red-600 group-hover:to-red-600"
                style={{ height: `${height}%`, maxHeight: '220px', minHeight: '4px' }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {item.count} activities
                </div>
              </div>
            </div>
            <div className="mt-3 text-center">
              <p className="text-xs font-medium text-gray-700">{item.day}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ===== Stat Card Component ===== */
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
        <div className={`p-3 rounded-xl bg-linear-to-br ${bgColor}`}>
          <div className={`p-1.5 rounded-lg bg-linear-to-br ${color}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActivityLogs;