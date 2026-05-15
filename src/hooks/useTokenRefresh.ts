import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const useTokenRefresh = () => {
  const { refreshToken } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);

  // Auto-refresh token periodically (every 50 minutes)
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime;
      
      // Refresh every 50 minutes (3000000 ms)
      if (timeSinceLastRefresh >= 3000000 && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await refreshToken();
          setLastRefreshTime(Date.now());
          console.log('Token auto-refreshed successfully');
        } catch (error) {
          console.error('Auto token refresh failed:', error);
        } finally {
          setIsRefreshing(false);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [refreshToken, isRefreshing, lastRefreshTime]);

  // Manual refresh function
  const manualRefresh = async (): Promise<boolean> => {
    if (isRefreshing) return false;
    
    setIsRefreshing(true);
    try {
      const success = await refreshToken();
      if (success) {
        setLastRefreshTime(Date.now());
        console.log('Manual token refresh successful');
      }
      return success;
    } catch (error) {
      console.error('Manual token refresh failed:', error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    isRefreshing,
    manualRefresh,
    lastRefreshTime,
  };
};
