// components/RelationManagementDashboard.tsx
import React, { useState, useEffect } from 'react';
import RelationSuggest from './RelationSuggest';
import FixedRelationsManager from './FixedRelationsManager';
import RelationOverridesManager from './RelationOverridesManager';
import ActivityLogs from './ActivityLogs';
import { ActivitySummary } from './types/index';

const RelationManagementDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'suggest' | 'fixed' | 'overrides' | 'logs'>('suggest');
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null);

  useEffect(() => {
    fetchActivitySummary();
  }, []);

  const fetchActivitySummary = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/relation-activity-logs/summary/`);
      const data = await response.json();
      setActivitySummary(data);
    } catch (error) {
      console.error('Error fetching activity summary:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Relation Management System</h1>
          <p className="text-gray-600 mt-2">Manage relation suggestions, fixed relations, and overrides</p>
          
          {/* Activity Summary Cards */}
          {activitySummary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Today's Activities</h3>
                <p className="text-2xl font-bold text-gray-900 mt-2">{activitySummary.today}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">This Week</h3>
                <p className="text-2xl font-bold text-gray-900 mt-2">{activitySummary.this_week}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Top Actions</h3>
                <div className="mt-2">
                  {Object.entries(activitySummary.by_action).map(([action, count]) => (
                    <div key={action} className="flex justify-between">
                      <span className="text-sm text-gray-600">{action}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'suggest', label: 'Relation Suggestions' },
              { id: 'fixed', label: 'Fixed Relations' },
              { id: 'overrides', label: 'Relation Overrides' },
              { id: 'logs', label: 'Activity Logs' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'suggest' && <RelationSuggest />}
          {activeTab === 'fixed' && <FixedRelationsManager />}
          {activeTab === 'overrides' && <RelationOverridesManager />}
          {activeTab === 'logs' && <ActivityLogs />}
        </div>
      </div>
    </div>
  );
};

export default RelationManagementDashboard;