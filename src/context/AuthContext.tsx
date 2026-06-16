import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AuthState, AuthUser } from '@/types/transaction';
import { authApi } from '@/lib/api';
import { env, validateCredentials } from '@/config/env';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'elst_auth_token';
const VALIDATION_INTERVAL = 60_000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    user: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const validationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  const validateToken = useCallback(async (token: string): Promise<AuthUser | null> => {
    try {
      const result = await authApi.validateToken(token);

      if (result.valid && result.user) {
        return {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
        };
      }
      return null;
    } catch (error) {
      console.error('Token validation failed:', error);
      return null;
    }
  }, []);

  const logout = useCallback(() => {
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

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    if (!username.trim() || !password) {
      setIsLoading(false);
      return false;
    }

    if (!validateCredentials(username, password)) {
      setIsLoading(false);
      return false;
    }

    const token = env.auth.token;
    if (!token) {
      console.error('VITE_AUTH_TOKEN is not configured');
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

  useEffect(() => {
    if (state.isAuthenticated && state.token) {
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
      }

      validationIntervalRef.current = setInterval(async () => {
        if (state.token) {
          const user = await validateToken(state.token);

          if (!user) {
            toast({
              title: 'Session Expired',
              description: 'Your session has expired. Please login again.',
              variant: 'destructive',
            });

            logout();
          }
        }
      }, VALIDATION_INTERVAL);

      return () => {
        if (validationIntervalRef.current) {
          clearInterval(validationIntervalRef.current);
          validationIntervalRef.current = null;
        }
      };
    }
  }, [state.isAuthenticated, state.token, validateToken, logout, toast]);

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
