import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTokenRefresh } from '../hooks/useTokenRefresh';

/**
 * Example component showing how to use the enhanced token refresh system
 */
export const TokenRefreshExample: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isRefreshing, manualRefresh } = useTokenRefresh();

  // Example: Handle network errors and token expiration
  const handleApiCall = async () => {
    try {
      // Your API call here - token refresh is handled automatically by the interceptor
      const response = await fetch('/api/some-protected-endpoint/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('API call failed');
      }
      
      const data = await response.json();
      console.log('API call successful:', data);
    } catch (error) {
      console.error('API call error:', error);
      
      // If it's a 401 error, the interceptor will automatically try to refresh the token
      // If refresh fails, user will be redirected to login
    }
  };

  // Example: Manual token refresh when needed
  const handleManualRefresh = async () => {
    const success = await manualRefresh();
    if (success) {
      console.log('Token refreshed manually');
    } else {
      console.log('Manual refresh failed - user may need to login again');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Token Refresh Example</h2>
      
      {isAuthenticated ? (
        <div className="space-y-4">
          <p>Welcome, {user?.full_name}!</p>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Token Status: {isRefreshing ? 'Refreshing...' : 'Valid'}
            </span>
            {isRefreshing && (
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          <div className="space-x-2">
            <button
              onClick={handleApiCall}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              disabled={isRefreshing}
            >
              Make API Call
            </button>
            
            <button
              onClick={handleManualRefresh}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              disabled={isRefreshing}
            >
              Refresh Token
            </button>
            
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      ) : (
        <p>Please login to use this feature.</p>
      )}
    </div>
  );
};

/**
 * Usage Instructions:
 * 
 * 1. The token refresh happens automatically in the background
 * 2. When a 401 error occurs, the interceptor will:
 *    - Try to refresh the token using the refresh token
 *    - Retry the original request with the new token
 *    - If refresh fails, clear all tokens and redirect to login
 * 
 * 3. You can use the useTokenRefresh hook for:
 *    - Manual token refresh when needed
 *    - Checking if token is currently refreshing
 *    - Auto-refresh every 50 minutes
 * 
 * 4. The AuthContext provides:
 *    - login(): User login with token storage
 *    - logout(): Clean logout with server notification
 *    - refreshToken(): Manual token refresh
 *    - isAuthenticated: Check authentication status
 * 
 * 5. No changes needed in existing API calls - the interceptor handles everything
 */
