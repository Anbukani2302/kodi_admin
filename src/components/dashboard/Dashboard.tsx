import { useEffect, useState } from 'react';
import { Users, UserPlus, Activity, TrendingUp, Calendar, Filter, X } from 'lucide-react';
import { getDashboardStats } from '../../services/dashboardService';
import { useLanguage } from '../../context/LanguageContext';
import { PermissionDenied } from '../common/PermissionDenied';

/* ===== Types ===== */
type StaffRecentUser = {
  id: number;
  mobile_number: string;
  is_active: boolean;
  created_at: string;
  name: string;
};

type StaffDashboardData = {
  total_users: number;
  inactive_users: number;
  active_users: number;
  today_new_users: number;
  week_new_users: number;
  active_last_month: number;
  recent_users: StaffRecentUser[];
  timestamp: string;
  user_type: 'staff';
};

type AdminDashboardData = {
  total_users: number;
  admin_count: number;
  staff_count: number;
  inactive_users: number;
  active_users: number;
  today_new_users: number;
  week_new_users: number;
  timestamp: string;
  recent_users?: any[]; // Admin also has recent_users
  recent_users_count?: number;
};

type DashboardData = StaffDashboardData | AdminDashboardData;

type FilterPeriod = 'today' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'all';

/* ===== Component ===== */
export function Dashboard() {
  const { t } = useLanguage();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter state
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCustomDate, setShowCustomDate] = useState(false);

  // Initial load - default API call (no params)
  useEffect(() => {
    fetchDashboardData(); // GET /api/admin/dashboard/
  }, []);

  const fetchDashboardData = async (params?: any) => {
    setLoading(true);
    try {
      // If params is undefined, call without params
      // If params is an object with properties, pass it as query params
      const res = await getDashboardStats(params);
      console.log('Dashboard data:', res.data);
      console.log('API URL:', res.config.url, 'Params:', params);
      setData(res.data);
      setError('');
    } catch (err: any) {
      console.error('Dashboard error', err.response || err);
      
      // Check for 403 Forbidden status
      if (err.response?.status === 403) {
        const errorMessage = err.response?.data?.detail || err.response?.data?.error || err.response?.data?.message || 'You do not have permission to perform this action.';
        setError(errorMessage);
        return;
      }
      
      const errorMessage = err.response?.data?.detail || err.response?.data?.error || err.response?.data?.message || 'Failed to load dashboard data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter change - API call on every dropdown selection
  const handleFilterChange = (period: FilterPeriod) => {
    setFilterPeriod(period);
    setShowCustomDate(period === 'custom');
    
    // Reset custom dates when switching away from custom
    if (period !== 'custom') {
      setStartDate('');
      setEndDate('');
    }
    
    // API call based on selected period
    if (period === 'all') {
      // GET /api/admin/dashboard/ (no params)
      fetchDashboardData();
    } else if (period === 'custom') {
      // Don't make API call yet - wait for apply button
      return;
    } else {
      // GET /api/admin/dashboard/?period=today
      // GET /api/admin/dashboard/?period=weekly
      // GET /api/admin/dashboard/?period=monthly
      // GET /api/admin/dashboard/?period=yearly
      fetchDashboardData({ period });
    }
  };

  // Handle custom date apply
  const handleCustomDateApply = () => {
    if (startDate && endDate) {
      // GET /api/admin/dashboard/?period=custom&start_date=2025-01-01&end_date=2025-01-31
      fetchDashboardData({
        period: 'custom',
        start_date: startDate,
        end_date: endDate
      });
    }
  };

  // Clear filter - back to all users
  const handleClearFilter = () => {
    setFilterPeriod('all');
    setShowCustomDate(false);
    setStartDate('');
    setEndDate('');
    // GET /api/admin/dashboard/ (no params)
    fetchDashboardData();
  };

  // Check if user is staff based on response data
  const isStaff = data && 'user_type' in data && data.user_type === 'staff';

  // Safe function to get user initial from name
  const getUserInitial = (name: string) => {
    if (!name || name.trim().length === 0) {
      return '?';
    }
    return name.charAt(0).toUpperCase();
  };

  // Format date for user view
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format period display name
  const getPeriodDisplayName = (period: FilterPeriod) => {
    const periodNames = {
      today: 'Today',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
      custom: 'Custom Range',
      all: 'All Time'
    };
    return periodNames[period];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('dashboard.loadingData')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    if (error.toLowerCase().includes('permission') || error.toLowerCase().includes('not have permission')) {
      return <PermissionDenied message={error} />;
    }
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="bg-red-50 p-4 rounded-full inline-flex mb-4">
            <Activity className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">{t('dashboard.noDashboardData')}</h3>
          <p className="text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="bg-red-50 p-4 rounded-full inline-flex mb-4">
            <Activity className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">{t('dashboard.noDashboardData')}</h3>
          <p className="text-gray-500 mt-2">{t('dashboard.unableToLoad')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Header with Filter Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isStaff ? 'Staff Dashboard' : t('dashboard.title')}
          </h1>
          <p className="text-gray-500 mt-1">
            {isStaff ? 'Welcome back, Staff Member' : t('dashboard.welcome')}
          </p>
        </div>
        
        {/* Filter Section - Left side of real-time area */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          {/* Filter Dropdown - API call on every selection */}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterPeriod}
              onChange={(e) => handleFilterChange(e.target.value as FilterPeriod)}
              className="text-sm font-medium bg-transparent border-none focus:ring-0 focus:outline-none text-gray-700 pr-8"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range - Appears only when Custom is selected */}
          {showCustomDate && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border w-full sm:w-auto">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Start date"
                />
                <span className="text-gray-500 hidden sm:inline">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="End date"
                />
                <button
                  onClick={handleCustomDateApply}
                  disabled={!startDate || !endDate}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            </div>
          )}

          {/* Clear Filter Button - Only show if filter is not 'all' */}
          {filterPeriod !== 'all' && (
            <button
              onClick={handleClearFilter}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 bg-white rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Clear</span>
            </button>
          )}

          {/* Real-time Status Badge with Active Filter */}
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm border">
            <TrendingUp className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium">
              {isStaff ? 'Live Stats' : t('dashboard.realTimeData')}
            </span>
            {filterPeriod !== 'all' && (
              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                {getPeriodDisplayName(filterPeriod)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <StatCard
          title={t('dashboard.totalUsers')}
          value={data.total_users}
          icon={Users}
          trend="total"
          color="red"
        />
        
        {/* Today New Users */}
        <StatCard
          title={t('dashboard.todayNew')}
          value={data.today_new_users}
          icon={UserPlus}
          trend={data.today_new_users > 0 ? 'up' : 'static'}
          color="green"
        />
        
        {/* Inactive Users */}
        <StatCard
          title={t('dashboard.inactiveUsers') || 'Inactive Users'}
          value={data.inactive_users}
          icon={Users}
          trend="static"
          color="blue"
        />
        
        {/* Active Users */}
        <StatCard
          title={t('dashboard.activeUsers')}
          value={data.active_users}
          icon={Activity}
          trend={data.active_users > 0 ? 'up' : 'static'}
          color="purple"
        />
      </div>

      {/* Staff Additional Info Card - ONLY FOR STAFF */}
      {isStaff && 'active_last_month' in data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-linear-to-br from-red-50 to-red-50 rounded-2xl border border-red-100 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-600 rounded-xl shadow-lg shadow-red-200">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('dashboard.thisMonth')}</p>
                <p className="text-2xl font-bold text-gray-900">{data.active_last_month}</p>
                <p className="text-xs text-gray-500 mt-1">{t('dashboard.activeUsers')} {t('dashboard.vs30Days')}</p>
              </div>
            </div>
          </div>

          <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-600 rounded-xl shadow-lg shadow-green-200">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('dashboard.todayNew')}</p>
                <p className="text-2xl font-bold text-gray-900">{data.week_new_users}</p>
                <p className="text-xs text-gray-500 mt-1">{t('dashboard.newUserJoined')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart Section */}
      <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">User Statistics</h2>
              <p className="text-gray-500 mt-1">
                {filterPeriod === 'all' 
                  ? 'All time overview' 
                  : `Showing data for ${getPeriodDisplayName(filterPeriod).toLowerCase()}`}
              </p>
            </div>
            {filterPeriod !== 'all' && (
              <div className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                Filtered: {getPeriodDisplayName(filterPeriod)}
              </div>
            )}
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-8 items-end h-48">
            <Bar
              label={t('dashboard.totalUsers')}
              value={data.total_users}
              max={Math.max(data.total_users * 1.2, 100)}
              color="indigo"
            />
            <Bar
              label={t('dashboard.activeUsers')}
              value={data.active_users}
              max={Math.max(data.total_users * 1.2, 100)}
              color="green"
            />
            <Bar
              label={t('dashboard.inactiveUsers') || 'Inactive Users'}
              value={data.inactive_users}
              max={Math.max(data.total_users * 1.2, 100)}
              color="blue"
            />
            <Bar
              label={t('dashboard.todayNew')}
              value={data.today_new_users}
              max={Math.max(data.total_users * 1.2, 100)}
              color="purple"
            />
          </div>
          <div className="mt-8 pt-6 border-t flex flex-wrap gap-4">
            <LegendItem color="indigo" label={t('dashboard.totalUsers')} />
            <LegendItem color="green" label={t('dashboard.activeUsers')} />
            <LegendItem color="blue" label={t('dashboard.inactiveUsers') || 'Inactive Users'} />
            <LegendItem color="purple" label={t('dashboard.todayNew')} />
          </div>
        </div>
      </div>

      {/* Recent Users - BOTH ADMIN AND STAFF CAN SEE */}
      {data.recent_users && data.recent_users.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {t('dashboard.recentUsers')}
                </h2>
                <p className="text-gray-500 mt-1">
                  {t('dashboard.latest')} {data.recent_users.length} {t('dashboard.users')}{data.recent_users.length > 1 ? 's' : ''}
                  {filterPeriod !== 'all' && ` (${getPeriodDisplayName(filterPeriod)})`}
                </p>
              </div>
              <div className={`${isStaff ? 'bg-red-50 text-red-700' : 'bg-red-50 text-red-700'} px-3 py-1 rounded-full text-sm font-medium`}>
                {t('dashboard.latest')}
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {data.recent_users.map((user) => (
              <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left side - User Info */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${
                        isStaff 
                          ? 'from-red-500 to-red-600' 
                          : 'from-red-500 to-red-600'
                      } flex items-center justify-center shadow-lg ${
                        isStaff ? 'shadow-red-200' : 'shadow-red-200'
                      }`}>
                        <span className="text-white font-bold text-lg">
                          {getUserInitial(user.name)}
                        </span>
                      </div>
                      {user.is_active && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {user.name || 'Anonymous'}
                        </h3>
                        {user.is_active ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            Inactive
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <span className="text-gray-400">📱</span>
                          {user.mobile_number}
                        </span>
                        {user.email && user.email.trim() !== '' && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-600 flex items-center gap-1">
                              <span className="text-gray-400">📧</span>
                              {user.email}
                            </span>
                          </>
                        )}
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-500 flex items-center gap-1">
                          <span className="text-gray-400">🆔</span>
                          #{user.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side - Join Date */}
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">📅</span>
                      <span className="text-sm font-medium text-gray-700">
                        {formatDate(user.created_at)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {t('dashboard.joinDate')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Show count if available */}
          {'recent_users_count' in data && data.recent_users_count && data.recent_users_count > data.recent_users.length && (
            <div className="p-4 bg-gray-50 border-t text-center">
              <p className="text-sm text-gray-600">
                {t('dashboard.noRecentUsers')}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Empty State for Recent Users */
        <div className="bg-white rounded-2xl shadow-lg border p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('dashboard.noRecentUsers')}</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {t('dashboard.unableToLoad')}
          </p>
          {filterPeriod !== 'all' && (
            <button
              onClick={handleClearFilter}
              className="mt-4 px-4 py-2 text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              Clear filter to see all users
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ===== StatCard Component ===== */
function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'indigo',
}: {
  title: string;
  value: number | undefined;
  icon: React.ElementType;
  trend: 'up' | 'down' | 'static' | 'total';
  color?: 'indigo' | 'red' | 'green' | 'blue' | 'purple';
}) {
  const { t } = useLanguage();
  const safeValue = value ?? 0;
  
  const colorClasses = {
    indigo: 'bg-red-600',
    red: 'bg-red-600',
    green: 'bg-green-600',
    blue: 'bg-red-600',
    purple: 'bg-purple-600',
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    static: '→',
    total: '📊',
  };

  const trendText = {
    up: t('dashboard.growing'),
    down: t('dashboard.declining'),
    static: t('dashboard.stable'),
    total: t('dashboard.total'),
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{safeValue.toLocaleString()}</p>
          <div className="flex items-center mt-3">
            <span className={`text-sm font-medium ${
              trend === 'up' ? 'text-green-600' :
              trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {trendIcons[trend]} {trendText[trend]}
            </span>
          </div>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]} shadow-md`}>
          <Icon className="text-white w-6 h-6" />
        </div>
      </div>
      <div className="mt-4 pt-4 border-t">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${colorClasses[color]}`}
            style={{ width: `${Math.min(safeValue / 10, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ===== Bar Component ===== */
function Bar({
  label,
  value,
  max,
  color = 'indigo',
}: {
  label: string;
  value: number | undefined;
  max: number;
  color?: 'indigo' | 'red' | 'green' | 'blue' | 'purple';
}) {
  const { t } = useLanguage();
  const safeValue = value ?? 0;
  const height = max > 0 ? Math.min((safeValue / max) * 100, 100) : 0;

  const colorClasses = {
    indigo: 'bg-gradient-to-t from-red-500 to-red-400',
    red: 'bg-gradient-to-t from-red-500 to-red-400',
    green: 'bg-gradient-to-t from-green-500 to-green-400',
    blue: 'bg-gradient-to-t from-red-500 to-red-400',
    purple: 'bg-gradient-to-t from-purple-500 to-purple-400',
  };

  return (
    <div className="flex-1 flex flex-col items-center group">
      <div className="relative w-full flex justify-center">
        <div className="w-16 rounded-t-lg overflow-hidden h-32 flex flex-col-reverse">
          <div
            className={`${colorClasses[color]} transition-all duration-500 ease-out w-full`}
            style={{ height: `${height}%` }}
          />
        </div>
        <div className="absolute -top-8 bg-gray-900 text-white px-2 py-1 rounded text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          {safeValue}
        </div>
      </div>
      <span className="mt-4 text-sm font-semibold text-gray-700">{label}</span>
      <span className="text-xs text-gray-500 mt-1">{safeValue} {t('dashboard.users')}</span>
    </div>
  );
}

/* ===== LegendItem Component ===== */
function LegendItem({ color, label }: { color: string; label: string }) {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-red-500',
    red: 'bg-red-500',
    green: 'bg-green-500',
    blue: 'bg-red-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="flex items-center">
      <div className={`w-3 h-3 rounded-full ${colorClasses[color] || 'bg-gray-500'} mr-2`} />
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );
}

export default Dashboard;