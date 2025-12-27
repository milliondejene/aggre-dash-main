import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AuthState, AuthUser } from '@/types/transaction';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType extends AuthState {
  login: (token: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'elst_auth_token';
const VALIDATION_INTERVAL = 2000; // 2 seconds

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    user: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const validationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const validateToken = useCallback(async (token: string): Promise<AuthUser | null> => {
    try {
      const result = await authApi.validateToken(token);
      
      if (result.valid && result.user) {
        return {
          id: result.user.id || 'user_1',
          name: result.user.name || 'User',
          email: result.user.email || 'user@eaglelion.tech',
        };
      }
      return null;
    } catch (error) {
      console.error('Token validation failed:', error);
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    // Clear validation interval
    if (validationIntervalRef.current) {
      clearInterval(validationIntervalRef.current);
      validationIntervalRef.current = null;
    }

    localStorage.removeItem(STORAGE_KEY);
    setState({
      isAuthenticated: false,
      token: null,
      user: null,
    });
  }, []);

  const login = useCallback(async (token: string): Promise<boolean> => {
    setIsLoading(true);
    
    if (!token || token.trim().length === 0) {
      setIsLoading(false);
      return false;
    }
    
    const user = await validateToken(token);
    
    if (user) {
      localStorage.setItem(STORAGE_KEY, token);
      setState({
        isAuthenticated: true,
        token,
        user,
      });
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  }, [validateToken]);

  // Periodic token validation
  useEffect(() => {
    if (state.isAuthenticated && state.token) {
      // Clear any existing interval
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
      }

      // Set up periodic validation
      validationIntervalRef.current = setInterval(async () => {
        if (state.token) {
          const user = await validateToken(state.token);
          
          if (!user) {
            // Token is invalid or expired
            console.warn('Token validation failed - logging out user');
            
            toast({
              title: 'Session Expired',
              description: 'Your session has expired. Please login again.',
              variant: 'destructive',
            });
            
            logout();
          }
        }
      }, VALIDATION_INTERVAL);

      // Cleanup on unmount or when auth state changes
      return () => {
        if (validationIntervalRef.current) {
          clearInterval(validationIntervalRef.current);
          validationIntervalRef.current = null;
        }
      };
    }
  }, [state.isAuthenticated, state.token, validateToken, logout, toast]);

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem(STORAGE_KEY);
      if (savedToken) {
        const user = await validateToken(savedToken);
        if (user) {
          setState({
            isAuthenticated: true,
            token: savedToken,
            user,
          });
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [validateToken]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

