import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Mail, Eye, RefreshCw } from 'lucide-react';

interface EmailLog {
  id: string;
  recipient_email: string;
  subject: string;
  content: string;
  status: string;
  sent_at: string;
  created_at: string;
  opened_at?: string;
  delivered_at?: string;
  email_notification_templates?: {
    name: string;
  };
  template?: {
    name: string;
  };
}

interface EmailSentLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerEmail?: string;
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  opened: 'bg-purple-100 text-purple-800',
};

export const EmailSentLogsDialog: React.FC<EmailSentLogsDialogProps> = ({
  open,
  onOpenChange,
  customerEmail
}) => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [viewingEmail, setViewingEmail] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchEmailLogs();
    }
  }, [open, customerEmail]);

  const fetchEmailLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('notification_logs')
        .select(`
          id,
          recipient_email,
          subject,
          content,
          status,
          sent_at,
          created_at,
          opened_at,
          delivered_at,
          email_notification_templates (name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (customerEmail) {
        query = query.eq('recipient_email', customerEmail);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching email logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch email logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleViewEmail = (log: EmailLog) => {
    setSelectedLog(log);
    setViewingEmail(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Sent History
              {customerEmail && (
                <Badge variant="outline" className="ml-2">
                  {customerEmail}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {logs.length} email{logs.length !== 1 ? 's' : ''} found
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchEmailLogs}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading email history...</div>
            ) : logs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {customerEmail 
                      ? `No emails found for ${customerEmail}`
                      : 'No emails found'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Emails</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Template</TableHead>
                        <TableHead>Sent</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell className="font-medium">{log.recipient_email}</TableCell>
                          <TableCell className="max-w-[300px] truncate">{log.subject}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {log.email_notification_templates?.name || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {log.sent_at 
                              ? format(new Date(log.sent_at), 'MMM dd, yyyy HH:mm')
                              : format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')
                            }
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewEmail(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Content Viewer */}
      <Dialog open={viewingEmail} onOpenChange={setViewingEmail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Content
            </DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Recipient:</p>
                  <p className="text-sm text-muted-foreground">{selectedLog.recipient_email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status:</p>
                  {getStatusBadge(selectedLog.status)}
                </div>
                <div>
                  <p className="text-sm font-medium">Template:</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedLog.email_notification_templates?.name || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Sent:</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedLog.sent_at 
                      ? format(new Date(selectedLog.sent_at), 'MMM dd, yyyy HH:mm:ss')
                      : format(new Date(selectedLog.created_at), 'MMM dd, yyyy HH:mm:ss')
                    }
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Subject:</p>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">{selectedLog.subject}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Email Content:</p>
                <div 
                  className="p-4 bg-white border rounded-md max-h-96 overflow-y-auto"
                  style={{ fontFamily: 'system-ui, -apple-system' }}
                  dangerouslySetInnerHTML={{ __html: selectedLog.content }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};