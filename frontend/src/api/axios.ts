import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      // Ensure headers object exists and is an AxiosHeaders instance.
      if (!config.headers) config.headers = new AxiosHeaders();
      // Use AxiosHeaders.set to add the Authorization header.
      (config.headers as AxiosHeaders).set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors gracefully
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors - redirect to login
    // BUT: Don't intercept 401 on login/signup/forgot-password routes (these are expected auth failures)
    const currentPath = window.location.pathname;
    const isAuthRoute = currentPath === '/login' || 
                        currentPath === '/signup' || 
                        currentPath === '/forgot-password' || 
                        currentPath.startsWith('/reset-password');
    
    // Don't intercept 401 errors on auth routes - let them pass through with original error message
    if (error.response?.status === 401) {
      if (isAuthRoute) {
        // On auth routes, return the original error (login failed, invalid credentials, etc.)
        return Promise.reject(error);
      }
      
      // On protected routes, clear session and redirect to login
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('isAuthenticated');
      sessionStorage.removeItem('userName');
      sessionStorage.removeItem('userRole');
      
      // Redirect to login
      window.location.href = '/login';
      
      return Promise.reject({
        ...error,
        response: {
          ...error.response,
          data: {
            success: false,
            message: 'Session expired. Please login again.',
            error: 'UNAUTHORIZED'
          }
        }
      });
    }

    // Handle connection reset and network errors
    if (error.code === 'ERR_CONNECTION_RESET' || error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      console.error('❌ [AXIOS] Connection error:', error.code || error.message);
      return Promise.reject({
        ...error,
        response: {
          ...error.response,
          data: {
            success: false,
            message: 'Connection to server was reset. Please try again.',
            error: 'ERR_CONNECTION_RESET'
          },
          status: 503
        }
      });
    }

    // Ensure error response has proper structure
    if (!error.response) {
      return Promise.reject({
        ...error,
        response: {
          data: {
            success: false,
            message: error.message || 'Network error occurred',
            error: error.code || 'UNKNOWN_ERROR'
          },
          status: 503
        }
      });
    }

    return Promise.reject(error);
  }
);

export default api;
