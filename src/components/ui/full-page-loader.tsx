import React from 'react';
import { Loader2 } from 'lucide-react';

interface FullPageLoaderProps {
  message?: string;
  isVisible: boolean;
}

export const FullPageLoader: React.FC<FullPageLoaderProps> = ({ 
  message = 'Processing...', 
  isVisible 
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-card rounded-2xl p-8 shadow-card flex flex-col items-center gap-4 animate-scale-in">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-lg font-medium text-foreground">{message}</p>
      </div>
    </div>
  );
};
