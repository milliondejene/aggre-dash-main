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

const TOKEN_STORAGE_KEY = 'elst_auth_token';
const SESSION_STORAGE_KEY = 'elst_auth_session';
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

  const validateAccess = useCallback(async (token: string | null): Promise<AuthUser | null> => {
    try {
      const result = await authApi.validateAccess(token || undefined);

      if (result.valid && result.user) {
        return {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
        };
      }
      return null;
    } catch (error) {
      console.error('Access validation failed:', error);
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    if (validationIntervalRef.current) {
      clearInterval(validationIntervalRef.current);
      validationIntervalRef.current = null;
    }

    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
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

    const token = env.auth.token || null;
    const user = await validateAccess(token);

    if (user) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);

      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        localStorage.setItem(SESSION_STORAGE_KEY, '1');
      }

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
  }, [validateAccess]);

  useEffect(() => {
    if (state.isAuthenticated) {
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
      }

      validationIntervalRef.current = setInterval(async () => {
        const user = await validateAccess(state.token);

        if (!user) {
          toast({
            title: 'Session Expired',
            description: 'Your session has expired. Please login again.',
            variant: 'destructive',
          });

          logout();
        }
      }, VALIDATION_INTERVAL);

      return () => {
        if (validationIntervalRef.current) {
          clearInterval(validationIntervalRef.current);
          validationIntervalRef.current = null;
        }
      };
    }
  }, [state.isAuthenticated, state.token, validateAccess, logout, toast]);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);

      if (savedToken || savedSession) {
        const user = await validateAccess(savedToken);
        if (user) {
          setState({
            isAuthenticated: true,
            token: savedToken,
            user,
          });
        } else {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [validateAccess]);

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
