import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, Search, RefreshCw, Calendar } from "lucide-react";
import { format } from "date-fns";

interface NotificationLog {
  id: string;
  trigger_id: string;
  template_id: string;
  recipient_email: string;
  recipient_type: string;
  subject: string;
  content: string;
  entity_type: string;
  entity_id: string;
  status: string;
  delivery_id: string;
  error_message: string;
  sent_at: string;
  delivered_at: string;
  opened_at: string;
  created_at: string;
  notification_type: string;
  notification_triggers?: {
    name: string;
  };
  email_notification_templates?: {
    name: string;
  };
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  opened: 'bg-purple-100 text-purple-800',
};

export const NotificationLogsViewer = () => {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [recipientTypeFilter, setRecipientTypeFilter] = useState('all');
  const [notificationTypeFilter, setNotificationTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);
  const { toast } = useToast();

  const pageSize = 50;

  useEffect(() => {
    fetchLogs();
  }, [currentPage, statusFilter, recipientTypeFilter, notificationTypeFilter, searchTerm]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('notification_logs')
        .select(`
          *,
          notification_triggers (name),
          email_notification_templates (name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (recipientTypeFilter !== 'all') {
        query = query.eq('recipient_type', recipientTypeFilter);
      }

      if (notificationTypeFilter !== 'all') {
        query = query.eq('notification_type', notificationTypeFilter);
      }

      if (searchTerm) {
        query = query.or(
          `recipient_email.ilike.%${searchTerm}%,subject.ilike.%${searchTerm}%,entity_id.ilike.%${searchTerm}%`
        );
      }

      const { data, error, count } = await query;

      if (error) throw error;
      
      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notification logs",
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

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, subject, or entity ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="min-w-[300px]"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="opened">Opened</SelectItem>
          </SelectContent>
        </Select>

        <Select value={recipientTypeFilter} onValueChange={setRecipientTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Recipients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Recipients</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="cleaner">Cleaner</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>

        <Select value={notificationTypeFilter} onValueChange={setNotificationTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Channels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        {/* Additional statistics cards can be added here */}
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Logs ({totalCount})</CardTitle>
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading logs...</div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>
                        <Badge className={log.notification_type === 'sms' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                          {log.notification_type === 'sms' ? 'SMS' : 'Email'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium max-w-[150px] truncate">{log.recipient_email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.recipient_type}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{log.subject}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.notification_triggers?.name || (log.notification_type === 'sms' ? 'Manual SMS' : 'Unknown')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Notification Log Details</DialogTitle>
                              <DialogDescription>
                                Full details of the notification delivery
                              </DialogDescription>
                            </DialogHeader>
                            {selectedLog && (
                              <LogDetailView log={selectedLog} />
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface LogDetailViewProps {
  log: NotificationLog;
}

const LogDetailView: React.FC<LogDetailViewProps> = ({ log }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-2">Basic Information</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Channel:</strong> <Badge className={log.notification_type === 'sms' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>{log.notification_type === 'sms' ? 'SMS' : 'Email'}</Badge></div>
            <div><strong>Status:</strong> <Badge className={STATUS_COLORS[log.status as keyof typeof STATUS_COLORS]}>{log.status}</Badge></div>
            <div><strong>Recipient:</strong> {log.recipient_email}</div>
            <div><strong>Recipient Type:</strong> {log.recipient_type}</div>
            <div><strong>Entity:</strong> {log.entity_type} ({log.entity_id})</div>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Timing</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Created:</strong> {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}</div>
            {log.sent_at && (
              <div><strong>Sent:</strong> {format(new Date(log.sent_at), 'MMM dd, yyyy HH:mm:ss')}</div>
            )}
            {log.delivered_at && (
              <div><strong>Delivered:</strong> {format(new Date(log.delivered_at), 'MMM dd, yyyy HH:mm:ss')}</div>
            )}
            {log.opened_at && (
              <div><strong>Opened:</strong> {format(new Date(log.opened_at), 'MMM dd, yyyy HH:mm:ss')}</div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Subject</h4>
        <p className="text-sm bg-muted p-2 rounded">{log.subject}</p>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Content</h4>
        <div 
          className="text-sm bg-muted p-4 rounded max-h-96 overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: log.content }}
        />
      </div>

      {log.error_message && (
        <div>
          <h4 className="font-semibold mb-2 text-red-600">Error Message</h4>
          <p className="text-sm bg-red-50 text-red-700 p-2 rounded">{log.error_message}</p>
        </div>
      )}

      {log.delivery_id && (
        <div>
          <h4 className="font-semibold mb-2">Delivery ID</h4>
          <p className="text-sm font-mono bg-muted p-2 rounded">{log.delivery_id}</p>
        </div>
      )}
    </div>
  );
};