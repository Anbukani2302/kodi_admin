import { useLanguage } from '../../context/LanguageContext';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export function Analytics() {
  const { t } = useLanguage();

  const userGrowthData = [
    { month: 'Jan', users: 4500 },
    { month: 'Feb', users: 5200 },
    { month: 'Mar', users: 6100 },
    { month: 'Apr', users: 7300 },
    { month: 'May', users: 8800 },
    { month: 'Jun', users: 10200 },
    { month: 'Jul', users: 11500 },
    { month: 'Aug', users: 12543 },
  ];

  const userDistributionData = [
    { name: 'Admin', value: 5, color: '#6366f1' },
    { name: 'Staff', value: 15, color: '#8b5cf6' },
    { name: 'Regular Users', value: 12523, color: '#ec4899' },
  ];

  const activeUsersData = [
    { day: 'Mon', users: 7800 },
    { day: 'Tue', users: 8200 },
    { day: 'Wed', users: 8100 },
    { day: 'Thu', users: 8500 },
    { day: 'Fri', users: 8234 },
    { day: 'Sat', users: 7200 },
    { day: 'Sun', users: 6800 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {t('analytics.title')}
        </h1>
      </div>

      {/* User Growth Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('analytics.userGrowth')}
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={userGrowthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#6366f1"
              strokeWidth={2}
              name={t('analytics.users')}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('analytics.userDistribution')}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {userDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {userDistributionData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Users Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('analytics.activeUsers')}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activeUsersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="users"
                fill="#6366f1"
                name={t('analytics.users')}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Users',
            value: '12,543',
            change: '+12.5%',
            color: 'text-red-600',
          },
          {
            label: 'Active Today',
            value: '8,234',
            change: '+5.2%',
            color: 'text-green-600',
          },
          {
            label: 'New This Week',
            value: '342',
            change: '+18.3%',
            color: 'text-purple-600',
          },
          {
            label: 'Engagement Rate',
            value: '65.7%',
            change: '+2.4%',
            color: 'text-pink-600',
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-green-600 mt-1">{stat.change}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
