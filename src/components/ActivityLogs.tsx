// components/ActivityLogs.tsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, User, Clock, CheckCircle, XCircle, Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { ActivitySummary } from './types/index';
import api from '../services/api'; // Import your api service

interface ActivityLog {
  id: number;
  action: string;
  relation_code: string;
  details: string;
  user_mobile: string;
  user_name: string;
  timestamp: string;
  ip_address?: string;
}

interface ActivityLogsProps {
  onClose?: () => void;
}

const ActivityLogs: React.FC<ActivityLogsProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filterRelationCode, setFilterRelationCode] = useState<string>('');
  
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null);
  const [availableActions, setAvailableActions] = useState<string[]>([]);

  useEffect(() => {
    fetchActivityData();
  }, []);

  useEffect(() => {
    // Apply client-side filtering
    let filtered = logs;
    
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.relation_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_mobile.includes(searchTerm) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterAction !== 'all') {
      filtered = filtered.filter(log => log.action === filterAction);
    }
    
    if (filterRelationCode) {
      filtered = filtered.filter(log => 
        log.relation_code.toLowerCase().includes(filterRelationCode.toLowerCase())
      );
    }
    
    setFilteredLogs(filtered);
  }, [searchTerm, filterAction, filterRelationCode, logs]);

  const fetchActivityData = async () => {
    setIsLoading(true);
    try {
      // Build query params
      const params: Record<string, string> = {};
      
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (filterAction !== 'all') params.action = filterAction;
      if (filterRelationCode) params.relation_code = filterRelationCode;
      
      // Fetch activity logs with filters
      const logsResponse = await api.get('/relation-activity-logs/', { params });
      let logsData = logsResponse.data;
      
      // Handle different response formats
      if (logsData && typeof logsData === 'object') {
        if (Array.isArray(logsData.results)) {
          logsData = logsData.results;
        } else if (Array.isArray(logsData.data)) {
          logsData = logsData.data;
        } else if (Array.isArray(logsData.logs)) {
          logsData = logsData.logs;
        }
      }
      
      // Ensure it's an array
      const logsArray = Array.isArray(logsData) ? logsData : [];
      setLogs(logsArray);
      setFilteredLogs(logsArray);
      
      // Extract unique actions for filter dropdown
      const uniqueActions = Array.from(new Set(logsArray.map((log: ActivityLog) => log.action)));
      setAvailableActions(uniqueActions);
      
      // Fetch summary separately
      fetchActivitySummary();
      
    } catch (error) {
      console.error('Error fetching activity data:', error);
      setLogs([]);
      setFilteredLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivitySummary = async () => {
    try {
      const response = await api.get('/relation-activity-logs/summary/');
      setActivitySummary(response.data);
    } catch (error) {
      console.error('Error fetching activity summary:', error);
    }
  };

  const handleApplyFilters = () => {
    fetchActivityData();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterAction('all');
    setStartDate('');
    setEndDate('');
    setFilterRelationCode('');
    fetchActivityData();
  };

  const getActionIcon = (action: string) => {
    const iconConfig: Record<string, { icon: React.ReactNode; color: string }> = {
      create: { icon: <Plus className="w-4 h-4" />, color: 'text-green-600 bg-green-50' },
      update: { icon: <Edit className="w-4 h-4" />, color: 'text-red-600 bg-red-50' },
      delete: { icon: <Trash2 className="w-4 h-4" />, color: 'text-red-600 bg-red-50' },
      approve: { icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-600 bg-green-50' },
      reject: { icon: <XCircle className="w-4 h-4" />, color: 'text-red-600 bg-red-50' },
      relation_create: { icon: <Plus className="w-4 h-4" />, color: 'text-green-600 bg-green-50' },
      relation_update: { icon: <Edit className="w-4 h-4" />, color: 'text-red-600 bg-red-50' },
      relation_delete: { icon: <Trash2 className="w-4 h-4" />, color: 'text-red-600 bg-red-50' },
      override_create: { icon: <Plus className="w-4 h-4" />, color: 'text-purple-600 bg-purple-50' },
      override_delete: { icon: <Trash2 className="w-4 h-4" />, color: 'text-red-600 bg-red-50' },
    };
    
    const config = iconConfig[action] || { icon: <Plus className="w-4 h-4" />, color: 'text-gray-600 bg-gray-50' };
    
    return (
      <div className={`p-2 rounded-lg ${config.color}`}>
        {config.icon}
      </div>
    );
  };

  const getActionBadge = (action: string) => {
    const colorConfig: Record<string, string> = {
      create: 'bg-green-100 text-green-800',
      update: 'bg-red-100 text-red-800',
      delete: 'bg-red-100 text-red-800',
      approve: 'bg-emerald-100 text-emerald-800',
      reject: 'bg-rose-100 text-rose-800',
      relation_create: 'bg-green-100 text-green-800',
      relation_update: 'bg-red-100 text-red-800',
      relation_delete: 'bg-red-100 text-red-800',
      override_create: 'bg-purple-100 text-purple-800',
      override_delete: 'bg-red-100 text-red-800',
    };
    
    const color = colorConfig[action] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${color}`}>
        {action.replace('_', ' ')}
      </span>
    );
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get first day of current month
  const getFirstDayOfMonth = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  };

  // Quick filter buttons
  const quickFilters = [
    { label: 'Today', start: getTodayDate(), end: getTodayDate() },
    { label: 'This Week', start: getFirstDayOfMonth(), end: getTodayDate() },
    { label: 'Last 7 Days', start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: getTodayDate() },
    { label: 'This Month', start: getFirstDayOfMonth(), end: getTodayDate() }
  ];

  return (
    <div className="p-6">
      {onClose && (
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Activity Logs</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Track all relation management activities</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchActivityData}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {activitySummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Today's Activities</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{activitySummary.today}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">This Week</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{activitySummary.this_week}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Top User</h3>
            {activitySummary.top_users && activitySummary.top_users.length > 0 ? (
              <div className="mt-2">
                <p className="font-medium text-gray-900 dark:text-white">{activitySummary.top_users[0].full_name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{activitySummary.top_users[0].activity_count} activities</p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">-</p>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Most Common Action</h3>
            {activitySummary.by_action && Object.entries(activitySummary.by_action).length > 0 ? (
              <div className="mt-2">
                <p className="font-medium text-gray-900 dark:text-white capitalize">
                  {Object.entries(activitySummary.by_action)
                    .sort(([,a], [,b]) => b - a)[0][0].replace('_', ' ')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {Object.entries(activitySummary.by_action)
                    .sort(([,a], [,b]) => b - a)[0][1]} times
                </p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">-</p>
            )}
          </div>
        </div>
      )}

      {/* Quick Filters */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Filters</h3>
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter, index) => (
            <button
              key={index}
              onClick={() => {
                setStartDate(filter.start);
                setEndDate(filter.end);
              }}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-gray-900 dark:text-white">Filters</h3>
          <div className="flex gap-2">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
            >
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
            >
              Clear All
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Action Type</label>
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
                {availableActions.map(action => (
                  <option key={action} value={action}>{action.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relation Code</label>
            <input
              type="text"
              value={filterRelationCode}
              onChange={(e) => setFilterRelationCode(e.target.value.toUpperCase())}
              placeholder="e.g., FTH"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-900"
            />
          </div>
        </div>
        
        {/* Search */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by user, relation code, or details..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading activity logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
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
          <>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Action Icon */}
                    <div className="mt-1">
                      {getActionIcon(log.action)}
                    </div>
                    
                    {/* Log Details */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {getActionBadge(log.action)}
                          <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                            {log.relation_code}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                      
                      <p className="text-gray-700 dark:text-gray-300 mb-3">{log.details}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <User className="w-4 h-4 mr-1" />
                          {log.user_name} ({log.user_mobile})
                          {log.ip_address && (
                            <>
                              <span className="mx-2">•</span>
                              <span>IP: {log.ip_address}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination Info */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex justify-between items-center">
                <div>
                  Showing {filteredLogs.length} of {logs.length} activities
                </div>
                <div className="text-xs">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;