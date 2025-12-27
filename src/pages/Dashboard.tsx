import React, { useState, useCallback, useEffect } from 'react';
import { DLQMessageWithId, GeneralStats } from '@/types/transaction';
import { dlqApi, statsApi } from '@/lib/api';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowRight, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State
  const [stats, setStats] = useState<GeneralStats | null>(null);
  const [dlqHighlight, setDlqHighlight] = useState<DLQMessageWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load data
  const loadData = useCallback(async (showLoadingState = true) => {
    if (showLoadingState) setIsLoading(true);
    else setIsRefreshing(true);
    
    try {
      const [generalStats, dlqData] = await Promise.all([
        statsApi.getGeneral(),
        dlqApi.getMessages({ limit: 5 }) // Get top 5 recent DLQ messages
      ]);

      setStats(generalStats);
      setDlqHighlight(dlqData.messages);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard statistics.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        onRefresh={() => loadData(false)} 
        isRefreshing={isRefreshing} 
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <StatsCards stats={stats} isLoading={isLoading} />

        {/* DLQ Highlight Section */}
        <Card className="glass-card shadow-card animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Recent DLQ Incidents
              </CardTitle>
              <CardDescription>
                Overview of recently failed messages requiring attention.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/dlq')}>
              View All DLQ <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border/50 overflow-hidden">
               <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/20">
                    <TableHead>Message ID</TableHead>
                    <TableHead>Error Type</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Failed At</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(3)].map((_, i) => (
                      <TableRow key={i} className="animate-pulse">
                        <TableCell><div className="h-4 w-20 bg-secondary rounded" /></TableCell>
                        <TableCell><div className="h-4 w-16 bg-secondary rounded" /></TableCell>
                        <TableCell><div className="h-4 w-48 bg-secondary rounded" /></TableCell>
                        <TableCell><div className="h-4 w-24 bg-secondary rounded" /></TableCell>
                        <TableCell><div className="h-8 w-8 bg-secondary rounded ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : dlqHighlight.length === 0 ? (
                     <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircleIcon className="w-8 h-8 text-green-500/50" />
                          <p>No recent DLQ messages found. System is healthy.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    dlqHighlight.map((msg) => (
                      <TableRow key={msg.dlqMessageId} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-mono text-xs">{msg.dlqMessageId.substring(0, 8)}...</TableCell>
                        <TableCell>
                           <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                              msg.errorType === 'VALIDATION' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                              msg.errorType === 'TRANSIENT' ? 'bg-warning/10 text-warning-foreground border-warning/20' :
                              'bg-secondary text-secondary-foreground border-secondary-foreground/20'
                           }`}>
                            {msg.errorType}
                           </span>
                        </TableCell>
                        <TableCell className="max-w-md truncate text-sm text-muted-foreground" title={msg.error}>
                          {msg.error}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(msg.failedAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/dlq')}>
                            <RotateCw className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

// Helper icon component
const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default Dashboard;
