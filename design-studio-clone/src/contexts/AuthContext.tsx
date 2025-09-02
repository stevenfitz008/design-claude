import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '../types/api';
import { apiClient } from '../services/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Check if we have a stored user and valid token
      const storedUser = apiClient.getStoredUser();
      const isAuthenticated = apiClient.isAuthenticated();
      
      if (storedUser && isAuthenticated) {
        // Verify token is still valid by fetching current user
        try {
          const currentUser = await apiClient.getCurrentUser();
          setState({
            user: currentUser,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
        } catch (error) {
          // Token is invalid, try to refresh
          try {
            const refreshResponse = await apiClient.refreshToken();
            setState({
              user: refreshResponse.user,
              isLoading: false,
              isAuthenticated: true,
              error: null,
            });
          } catch (refreshError) {
            // Refresh failed, clear auth state
            clearAuthState();
          }
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      clearAuthState();
    }
  };

  const clearAuthState = () => {
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
  };

  const login = async (credentials: LoginRequest) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const authResponse = await apiClient.login(credentials);
      
      setState({
        user: authResponse.user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Login failed',
      }));
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const authResponse = await apiClient.register(userData);
      
      setState({
        user: authResponse.user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Registration failed',
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      // Even if logout request fails, clear local state
      console.error('Logout request failed:', error);
    } finally {
      clearAuthState();
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const refreshUser = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const currentUser = await apiClient.getCurrentUser();
      
      setState(prev => ({
        ...prev,
        user: currentUser,
        isLoading: false,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to refresh user data',
      }));
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook for protected routes
export const useRequireAuth = (): AuthContextType => {
  const auth = useAuth();
  
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // Redirect to login page
      window.location.href = '/login';
    }
  }, [auth.isLoading, auth.isAuthenticated]);
  
  return auth;
};

export default AuthContext;