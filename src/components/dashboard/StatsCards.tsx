import React from 'react';
import { GeneralStats } from '@/types/transaction';
import { TrendingUp, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  stats: GeneralStats | null;
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconClassName?: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, iconClassName, delay = 0 }) => (
  <div 
    className="glass-card rounded-xl p-5 shadow-card animate-slide-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center",
        iconClassName
      )}>
        {icon}
      </div>
    </div>
  </div>
);

const StatCardSkeleton: React.FC = () => (
  <div className="glass-card rounded-xl p-5 shadow-card animate-pulse">
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <div className="h-4 w-20 bg-secondary rounded" />
        <div className="h-7 w-16 bg-secondary rounded" />
      </div>
      <div className="w-10 h-10 bg-secondary rounded-lg" />
    </div>
  </div>
);

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, isLoading }) => {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        title="Total Transactions"
        value={stats.processing.totalProcessed.toLocaleString()}
        icon={<TrendingUp className="w-5 h-5 text-foreground" />}
        iconClassName="gradient-gold"
        delay={0}
      />
      <StatCard
        title="Success Rate"
        value={`${((stats.processing.totalSuccess / (stats.processing.totalProcessed || 1)) * 100).toFixed(1)}%`}
        icon={<CheckCircle className="w-5 h-5 text-success-foreground" />}
        iconClassName="bg-success"
        delay={50}
      />
       <StatCard
        title="Processing"
        value={stats.database.processingCount.toLocaleString()}
        icon={<Clock className="w-5 h-5 text-warning-foreground" />}
        iconClassName="bg-warning"
        delay={100}
      />
      <StatCard
        title="Failed"
        value={stats.processing.totalFailed.toLocaleString()}
        icon={<XCircle className="w-5 h-5 text-destructive-foreground" />}
        iconClassName="bg-destructive"
        delay={150}
      />
      <StatCard
        title="Active DLQ"
        value={stats.dlq.length.toLocaleString()}
        icon={<AlertTriangle className="w-5 h-5 text-destructive-foreground" />}
        iconClassName="bg-destructive/80"
        delay={200}
      />
    </div>
  );
};
