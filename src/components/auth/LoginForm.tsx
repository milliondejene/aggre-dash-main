import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Key, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const LoginForm: React.FC = () => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!token.trim()) {
      setError('Please enter your access token');
      return;
    }

    setIsSubmitting(true);
    
    const success = await login(token);
    
    if (success) {
      toast({
        title: 'Welcome back!',
        description: 'Successfully authenticated',
      });
    } else {
      setError('Invalid or expired token. Please check and try again.');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-fade-in">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-gold shadow-gold mb-6 animate-pulse-gold">
            <Shield className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Eagle Lion System
          </h1>
          <p className="text-muted-foreground">
            Technologies LTD.
          </p>
        </div>

        {/* Login card */}
        <div className="glass-card rounded-2xl p-8 shadow-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-1">
              Aggregator Dashboard
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter your access token to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Enter your access token"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setError('');
                }}
                className="pl-10"
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive animate-scale-in">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Access Dashboard
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
          © 2024 Eagle Lion System Technologies LTD. All rights reserved.
        </p>
      </div>
    </div>
  );
};
