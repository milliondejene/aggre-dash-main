import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DLQMessageWithId, DLQStats } from '@/types/transaction';
import { dlqApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw, AlertTriangle, Clock, AlertCircle, Trash2, RotateCw, XCircle, Eye, Loader2 } from 'lucide-react';
import { DLQMessageDetailDialog } from '@/components/dashboard/DLQMessageDetailDialog';
import { FullPageLoader } from '@/components/ui/full-page-loader';

const ITEMS_PER_PAGE = 10;

const DLQMessages: React.FC = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<DLQMessageWithId[]>([]);
  const [stats, setStats] = useState<DLQStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewMessageId, setViewMessageId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');

  const loadData = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setIsRefreshing(true);
        setPage(1);
      } else {
        setIsLoading(true);
      }

      const [statsData, messagesData] = await Promise.all([
        dlqApi.getStats(),
        dlqApi.getMessages({ limit: ITEMS_PER_PAGE * page })
      ]);

      setStats(statsData);
      setMessages(messagesData.messages);
      setHasMore(messagesData.messages.length >= ITEMS_PER_PAGE * page);
    } catch (error) {
      console.error('Failed to load DLQ data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load DLQ messages',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRetry = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      setProcessingId(id);
      await dlqApi.retryMessage(id);
      toast({
        title: 'Success',
        description: 'Message requeued successfully',
      });
      await loadData(true);
    } catch (error) {
      console.error('Failed to retry message:', error);
      toast({
        title: 'Error',
        description: 'Failed to requeue message',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkRetry = async () => {
    if (selectedIds.length === 0) return;
    
    try {
      setIsProcessing(true);
      const { successful } = await dlqApi.bulkRetry(selectedIds);
      toast({
        title: 'Success',
        description: `Successfully requeued ${successful} message(s)`,
      });
      setSelectedIds([]);
      await loadData(true);
    } catch (error) {
      console.error('Failed to bulk retry messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to requeue messages',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      setIsDeleting(true);
      setDeleteMessage('Deleting message...');
      setProcessingId(id);
      await dlqApi.deleteMessage(id);
      setDeleteMessage('Refreshing data...');
      await loadData(true);
      toast({
        title: 'Success',
        description: 'Message deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
      setIsDeleting(false);
      setDeleteMessage('');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    try {
      setIsDeleting(true);
      setDeleteMessage(`Deleting ${selectedIds.length} message(s)...`);
      setIsProcessing(true);
      const { successful } = await dlqApi.bulkDelete(selectedIds);
      setDeleteMessage('Refreshing data...');
      setSelectedIds([]);
      await loadData(true);
      toast({
        title: 'Success',
        description: `Successfully deleted ${successful} message(s)`,
      });
    } catch (error) {
      console.error('Failed to bulk delete messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete messages',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setIsDeleting(false);
      setDeleteMessage('');
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(messages.map(msg => msg.dlqMessageId));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const getErrorTypeBadge = (type: string) => {
    const variants = {
      VALIDATION: { label: 'Validation', className: 'bg-destructive text-destructive-foreground' },
      TRANSIENT: { label: 'Transient', className: 'bg-yellow-500 text-yellow-50' },
      PERMANENT: { label: 'Permanent', className: 'bg-muted text-muted-foreground' },
    };
    
    const { label, className } = variants[type as keyof typeof variants] || { label: type, className: 'bg-muted' };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${className}`}>{label}</span>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <FullPageLoader isVisible={isDeleting} message={deleteMessage} />
      <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dead Letter Queue</h1>
          <p className="text-muted-foreground">
            {stats ? `${stats.length} total messages in DLQ` : 'Loading...'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => loadData(true)}
            disabled={isRefreshing || isProcessing || !!processingId}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {selectedIds.length > 0 && (
            <>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleBulkRetry}
                disabled={isProcessing || !!processingId}
              >
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCw className="mr-2 h-4 w-4" />}
                Retry Selected ({selectedIds.length})
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleBulkDelete}
                disabled={isProcessing || !!processingId}
              >
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Delete Selected ({selectedIds.length})
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oldest Message</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.oldestMessageAgeDays != null 
                ? `${Math.ceil(stats.oldestMessageAgeDays)}d ago` 
                : 'N/A'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validation Errors</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.errorTypeBreakdown?.VALIDATION || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transient Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.errorTypeBreakdown?.TRANSIENT || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Failed Messages</CardTitle>
          <CardDescription>
            Messages that failed processing and were moved to the Dead Letter Queue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedIds.length > 0 && selectedIds.length === messages.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                <TableHead>Message ID</TableHead>
                <TableHead>Error Type</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Retries</TableHead>
                <TableHead>Failed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No messages found in the Dead Letter Queue
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((message) => (
                  <TableRow 
                    key={message.dlqMessageId} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setViewMessageId(message.dlqMessageId)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={selectedIds.includes(message.dlqMessageId)}
                        onCheckedChange={(checked) => 
                          toggleSelectOne(message.dlqMessageId, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {message.errorType === 'TRANSIENT' ? (
                          <RotateCw className="mr-2 h-4 w-4 text-warning" />
                        ) : message.errorType === 'VALIDATION' ? (
                          <XCircle className="mr-2 h-4 w-4 text-destructive" />
                        ) : (
                          <AlertTriangle className="mr-2 h-4 w-4 text-muted-foreground" />
                        )}
                        {message.dlqMessageId.substring(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      {getErrorTypeBadge(message.errorType)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="truncate block max-w-xs">
                            {message.error || 'No error message'}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-sm">{message.error || 'No error message'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Badge variant={message.retryCount > 3 ? 'destructive' : 'outline'}>
                        {message.retryCount} {message.retryCount === 1 ? 'retry' : 'retries'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            {formatDistanceToNow(new Date(message.failedAt), { addSuffix: true })}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {new Date(message.failedAt).toLocaleString()}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewMessageId(message.dlqMessageId);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => handleRetry(message.dlqMessageId, e)}
                          disabled={isProcessing || !!processingId}
                        >
                          {processingId === message.dlqMessageId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCw className="h-4 w-4 mr-1" />
                          )}
                          {!processingId || processingId !== message.dlqMessageId ? 'Retry' : ''}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => handleDelete(message.dlqMessageId, e)}
                          disabled={isProcessing || !!processingId}
                        >
                          {processingId === message.dlqMessageId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
              </TableBody>
            </Table>
          </div>

          {hasMore && messages.length > 0 && (
            <div className="flex justify-center mt-4">
              <Button 
                variant="outline" 
                onClick={() => setPage(p => p + 1)}
                disabled={isRefreshing}
              >
                {isRefreshing ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <DLQMessageDetailDialog 
        messageId={viewMessageId} 
        onOpenChange={(open) => !open && setViewMessageId(null)} 
      />
      </div>
    </>
  );
};

export default DLQMessages;
