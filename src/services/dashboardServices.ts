import api from './api'; // make sure correct path

export const getAdminDashboard = () => {
  return api.get('/api/admin/dashboard/');
};
