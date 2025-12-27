import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from 'date-fns';
import { DLQMessageWithId } from '@/types/transaction';
import { dlqApi } from '@/lib/api';
import { Loader2, AlertCircle } from 'lucide-react';

interface DLQMessageDetailDialogProps {
  messageId: string | null;
  onOpenChange: (open: boolean) => void;
}

export const DLQMessageDetailDialog: React.FC<DLQMessageDetailDialogProps> = ({
  messageId,
  onOpenChange,
}) => {
  const [message, setMessage] = useState<DLQMessageWithId | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessage = async () => {
      if (!messageId) return;
      
      setIsLoading(true);
      setError(null);
      setMessage(null);
      
      try {
        const data = await dlqApi.getMessage(messageId);
        setMessage(data);
      } catch (err) {
        console.error("Failed to load message details:", err);
        setError("Failed to load message details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (messageId) {
      fetchMessage();
    }
  }, [messageId]);

  return (
    <Dialog open={!!messageId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>DLQ Message Details</DialogTitle>
          <DialogDescription>
            Message ID: <span className="font-mono">{messageId}</span>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 text-destructive">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p>{error}</p>
          </div>
        ) : message ? (
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Summary Section */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-muted-foreground mb-1">Error Type</h4>
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${
                      message.errorType === 'VALIDATION' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                      message.errorType === 'TRANSIENT' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                      'bg-secondary text-secondary-foreground border-secondary-foreground/20'
                  }`}>
                    {message.errorType}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-muted-foreground mb-1">Retry Count</h4>
                  <span className="font-mono">{message.retryCount}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-muted-foreground mb-1">Failed At</h4>
                  <span>{new Date(message.failedAt).toLocaleString()} ({formatDistanceToNow(new Date(message.failedAt), { addSuffix: true })})</span>
                </div>
                <div>
                  <h4 className="font-semibold text-muted-foreground mb-1">Consumer Group</h4>
                  <span className="font-mono">{message.consumerGroup}</span>
                </div>
              </div>

              {/* Error Message */}
              <div>
                <h4 className="font-semibold text-muted-foreground mb-2">Error Details</h4>
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 text-sm font-mono whitespace-pre-wrap text-destructive font-medium">
                  {message.error}
                </div>
              </div>

              {/* Transaction Data */}
              <div>
                <h4 className="font-semibold text-muted-foreground mb-2">Transaction Payload</h4>
                <div className="bg-zinc-950 text-zinc-50 rounded-md p-4 overflow-x-auto border border-border/50">
                  <pre className="text-xs font-mono">
                    {JSON.stringify(message.transactionData, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground border-t pt-4">
                 <div>
                    <span className="font-semibold">Original Message ID:</span> {message.originalMessageId}
                 </div>
                 <div>
                    <span className="font-semibold">Original Stream:</span> {message.originalStream}
                 </div>
              </div>
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
