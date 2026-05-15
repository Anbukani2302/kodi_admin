import api from './api';

// 📊 Dashboard data - with optional params for filtering
export const getDashboardStats = (params?: any) => {
  // If params is provided, send them as query params
  // This will generate URLs like:
  // - No params: GET /api/admin/dashboard/
  // - { period: 'today' }: GET /api/admin/dashboard/?period=today
  // - { period: 'weekly' }: GET /api/admin/dashboard/?period=weekly
  // - { period: 'monthly' }: GET /api/admin/dashboard/?period=monthly
  // - { period: 'yearly' }: GET /api/admin/dashboard/?period=yearly
  // - { period: 'custom', start_date: '2025-01-01', end_date: '2025-01-31' }: 
  //   GET /api/admin/dashboard/?period=custom&start_date=2025-01-01&end_date=2025-01-31
  return api.get('/api/admin/dashboard/', { params });
};

// 👥 Users list
export const getUsers = () => {
  return api.get('/api/admin/users/');
};