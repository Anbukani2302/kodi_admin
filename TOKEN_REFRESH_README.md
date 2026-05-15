# Token Refresh System Documentation

## Overview

This application implements a robust automatic token refresh system that handles JWT token expiration seamlessly. Users will never experience session timeouts due to expired access tokens.

## Features

### 1. Automatic Token Refresh
- **Background Refresh**: Tokens are automatically refreshed every 50 minutes
- **API Interceptor**: Automatically retries failed requests with new tokens
- **Error Handling**: Graceful fallback to login when refresh fails

### 2. Token Validation
- **Expiration Check**: Validates token expiration on app initialization
- **JWT Parsing**: Safely parses JWT tokens to check expiration time
- **Corrupted Data Handling**: Clears corrupted token data automatically

### 3. User Experience
- **Seamless Operation**: Users continue working without interruption
- **Manual Refresh**: Option to manually refresh tokens when needed
- **Visual Feedback**: Loading indicators during token refresh

## Architecture

### Core Components

#### 1. API Interceptor (`src/services/api.ts`)
```typescript
// Automatically handles 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Refresh token and retry request
    }
  }
);
```

#### 2. AuthContext (`src/context/AuthContext.tsx`)
```typescript
// Provides authentication methods
- login(): User authentication
- logout(): Clean logout with server notification
- refreshToken(): Manual token refresh
- isTokenExpired(): Token validation
```

#### 3. Token Refresh Hook (`src/hooks/useTokenRefresh.ts`)
```typescript
// Auto-refresh and manual refresh functionality
- Auto-refresh every 50 minutes
- Manual refresh capability
- Refresh status tracking
```

## Flow Diagram

```
User makes API request
       |
       v
API Interceptor adds Authorization header
       |
       v
[Request succeeds?] -> Yes -> Return response
       |
       No
       |
       v
[401 Error?] -> No -> Return error
       |
       Yes
       |
       v
[Already retried?] -> Yes -> Clear tokens, redirect to login
       |
       No
       |
       v
Refresh token using refresh token
       |
       v
[Refresh succeeds?] -> Yes -> Retry original request with new token
       |
       No
       |
       v
Clear all tokens, redirect to login
```

## Usage Examples

### Basic Usage (No Changes Needed)
```typescript
// Existing API calls work automatically
const fetchData = async () => {
  const response = await api.get('/api/data/');
  // Token refresh is handled automatically by interceptor
};
```

### Manual Token Refresh
```typescript
import { useTokenRefresh } from '../hooks/useTokenRefresh';

const MyComponent = () => {
  const { manualRefresh, isRefreshing } = useTokenRefresh();
  
  const handleRefresh = async () => {
    const success = await manualRefresh();
    if (success) {
      console.log('Token refreshed successfully');
    }
  };
  
  return (
    <button onClick={handleRefresh} disabled={isRefreshing}>
      Refresh Token
    </button>
  );
};
```

### Authentication State
```typescript
import { useAuth } from '../context/AuthContext';

const MyComponent = () => {
  const { user, isAuthenticated, logout } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.full_name}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <p>Please login</p>
      )}
    </div>
  );
};
```

## Token Storage

### LocalStorage Keys
- `accessToken`: JWT access token (short-lived)
- `refreshToken`: JWT refresh token (long-lived)
- `user`: User information JSON

### Token Lifecycle
1. **Login**: Both tokens stored in localStorage
2. **Access Token Expiration**: Automatically refreshed using refresh token
3. **Refresh Token Expiration**: User must login again
4. **Logout**: All tokens cleared from localStorage

## Error Handling

### 401 Unauthorized
- **Automatic**: Token refresh attempted
- **Success**: Original request retried with new token
- **Failure**: User redirected to login

### Network Errors
- **Timeout**: 10 second timeout for all requests
- **Retry**: Failed requests retried after token refresh
- **Fallback**: Graceful degradation to login page

### Corrupted Tokens
- **Detection**: Invalid JWT format detected
- **Action**: Clear all auth data
- **Result**: User redirected to login

## Configuration

### Environment Variables
```bash
VITE_API_BASE_URL=http://192.168.1.24:8002
```

### API Timeout
```typescript
timeout: 10000, // 10 seconds
```

### Auto-refresh Interval
```typescript
// Every 50 minutes (3000000 ms)
if (timeSinceLastRefresh >= 3000000)
```

## Security Features

### Token Validation
- JWT signature validation by backend
- Expiration time checking
- Corrupted token detection

### Secure Storage
- HttpOnly cookies recommended for production
- LocalStorage for development convenience
- Automatic cleanup on security events

### Refresh Token Security
- Server-side refresh token invalidation on logout
- Refresh token rotation (backend implementation)
- Secure refresh token endpoint

## Best Practices

### 1. API Calls
```typescript
// Use the api instance for automatic token handling
import api from '../services/api';

const response = await api.get('/api/data/');
```

### 2. Error Handling
```typescript
try {
  const response = await api.get('/api/data');
  // Handle success
} catch (error) {
  // Token refresh is handled automatically
  // Handle other errors here
}
```

### 3. Component Usage
```typescript
// Use the useAuth hook for authentication state
const { isAuthenticated, user } = useAuth();

// Use the useTokenRefresh hook for manual refresh
const { manualRefresh, isRefreshing } = useTokenRefresh();
```

## Troubleshooting

### Common Issues

#### 1. "Token refresh failed"
- **Cause**: Refresh token expired or invalid
- **Solution**: User must login again

#### 2. "No refresh token available"
- **Cause**: Tokens cleared from localStorage
- **Solution**: User must login again

#### 3. Infinite refresh loop
- **Cause**: Refresh endpoint returning 401
- **Solution**: Check refresh token endpoint implementation

#### 4. CORS errors during refresh
- **Cause**: Backend CORS configuration
- **Solution**: Ensure refresh endpoint allows credentials

### Debug Logging
```typescript
// Enable debug logging in development
if (import.meta.env.DEV) {
  console.log('Token refresh attempt:', refreshToken);
  console.log('Token refresh success:', newAccessToken);
}
```

## Migration Guide

### From Basic Auth to Token Refresh
1. **No changes needed** for existing API calls
2. **Import and use** AuthProvider in app root
3. **Optional**: Add useTokenRefresh hook for manual refresh
4. **Testing**: Test token expiration scenarios

### Example Integration
```typescript
// App.tsx
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <YourAppComponents />
    </AuthProvider>
  );
}
```

## Support

For issues with the token refresh system:
1. Check browser console for error messages
2. Verify backend refresh endpoint implementation
3. Ensure proper CORS configuration
4. Check localStorage for valid tokens

The system is designed to be robust and user-friendly, handling most token-related issues automatically without user intervention.
