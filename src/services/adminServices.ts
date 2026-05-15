// In your adminServices.ts file
import api from '../../src/services/api';

export const getAdminActivityLogs = () => {
  return api.get('/api/admin/admin-activity-logs/');
};