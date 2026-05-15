import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export const PermissionPage: React.FC<{ pageName: string; requiredPermission: string }> = ({
  pageName,
  requiredPermission
}) => {
  const { user } = useAuth();
  const [permissionData, setPermissionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchPermissions = async () => {
      // Admin users have full access, bypass API call
      if (user?.role === 'admin' || user?.user_type === 'admin') {
        setLoading(false);
        return;
      }

      if (user?.staff_id) {
        try {
          const response = await api.get(`/api/admin/staff/${user.staff_id}/permissions/`);
          console.log(`${pageName} - API Response:`, response.data);
          setPermissionData(response.data);
          setError('');
        } catch (error: any) {
          console.error(`Failed to fetch permissions for ${pageName}:`, error);
          if (error.response?.status === 403) {
            setError('API returned 403: Access Denied');
          } else {
            setError('Failed to fetch permissions');
          }
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user?.staff_id, user?.role, user?.user_type, pageName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
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
          {error}
        </p>
      </div>
    );
  }

  // Check if user has the required permission
  let hasPermission = false;
  if (user?.role === 'admin' || user?.user_type === 'admin') {
    hasPermission = true;
  } else {
    hasPermission = permissionData?.permissions?.[requiredPermission];
  }

  console.log(`${pageName} - Permission Check:`, { requiredPermission, hasPermission });

  if (!hasPermission) {
    return (
      <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            {pageName} - Permissions API Response:
          </h3>
          <pre className="bg-white p-3 rounded border text-sm overflow-auto max-h-96">
            {JSON.stringify(permissionData, null, 2)}
          </pre>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Access Denied:</h3>
          <p className="text-red-700">
            Required permission: <strong>{requiredPermission}</strong>
          </p>
          <p className="text-red-700">
            API response: <strong>{requiredPermission} = {hasPermission}</strong>
          </p>
          <p className="text-red-700 mt-2">
            You do not have permission to access {pageName}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          {pageName} - Access Granted
        </h3>
        <p className="text-green-700">
          Required permission: <strong>{requiredPermission}</strong>
        </p>
        <p className="text-green-700">
          API response: <strong>{requiredPermission} = {hasPermission}</strong>
        </p>
        <p className="text-green-700 mt-2">
          You have permission to access {pageName}. Loading page content...
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Full Permissions API Response:</h3>
        <pre className="bg-white p-3 rounded border text-sm overflow-auto max-h-96">
          {JSON.stringify(permissionData, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export function PermissionGranted({ message }: { message: string }) {
  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          Access Granted
        </h3>
        <p className="text-green-700">
          {message}
        </p>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">API Response Details:</h3>
        <p className="text-blue-700">
          Backend API returned success response with access granted.
        </p>
        <p className="text-blue-700 mt-2">
          Loading main application interface...
        </p>
      </div>
    </div>
  );
}
