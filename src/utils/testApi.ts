// Test API endpoint directly
import api from '../services/api';

export const testLoginEndpoint = async () => {
  try {
    console.log('Testing login endpoint...');
    
    // Test with minimal data
    const testData = {
      full_name: 'Test User',
      mobile_number: '+919876543210',
      email: 'test@example.com',
      password: 'testpassword123'
    };
    
    console.log('Sending test data:', testData);
    
    const response = await api.post('/api/admin/auth/login/', testData);
    console.log('Success:', response.data);
    
  } catch (error: any) {
    console.error('Test failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      config: error.config
    });
    
    // Log the full error for debugging
    if (error.response?.data) {
      console.error('Backend error details:', error.response.data);
    }
  }
};
