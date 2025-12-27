import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

type MainNavProps = {
  className?: string;
};

export const MainNav: React.FC<MainNavProps> = ({ className, ...props }) => {
  return (
    <nav className={cn('flex items-center space-x-4 lg:space-x-6', className)} {...props}>
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          cn(
            'text-sm font-medium transition-colors hover:text-primary',
            isActive ? 'text-primary' : 'text-muted-foreground'
          )
        }
      >
        Dashboard
      </NavLink>
      <NavLink
        to="/dlq"
        className={({ isActive }) =>
          cn(
            'text-sm font-medium transition-colors hover:text-primary',
            isActive ? 'text-primary' : 'text-muted-foreground'
          )
        }
      >
        DLQ Messages
      </NavLink>
    </nav>
  );
};
