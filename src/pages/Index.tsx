import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2, Shield } from 'lucide-react';
import { MainNav } from '@/components/MainNav';
import { UserNav } from '@/components/UserNav';

const Index: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === '/';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-gold shadow-gold mb-4 animate-pulse-gold">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Redirect to dashboard if authenticated and on the root path
  if (isAuthPage) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <MainNav className="mx-6" />
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Outlet />
      </div>
    </div>
  );
};

export default Index;
