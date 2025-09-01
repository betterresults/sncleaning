import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ActivityLog {
  id: string;
  created_at: string;
  user_email: string;
  user_role: string;
  action_type: string;
  entity_type?: string;
  entity_id?: string;
  details?: any;
  // Enhanced data
  booking_info?: {
    id: number;
    date_time: string;
    address: string;
    customer_name: string;
    total_cost: number;
  };
  customer_info?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

const ActivityLogsView = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Enhance logs with booking and customer info
      const enhancedLogs = await Promise.all((data || []).map(async (log) => {
        const enhanced: ActivityLog = { ...log };
        
        // If it's a booking-related log, fetch booking details
        if (log.entity_type === 'booking' && log.entity_id) {
          try {
            const { data: booking } = await supabase
              .from('bookings')
              .select(`
                id, date_time, address, total_cost,
                first_name, last_name, customer
              `)
              .eq('id', parseInt(log.entity_id))
              .single();
            
            if (booking) {
              enhanced.booking_info = {
                id: booking.id,
                date_time: booking.date_time,
                address: booking.address || 'No address',
                customer_name: `${booking.first_name || ''} ${booking.last_name || ''}`.trim() || 'Unknown',
                total_cost: booking.total_cost || 0
              };
            }
          } catch (bookingError) {
            // Try past_bookings if not found in bookings
            try {
              const { data: pastBooking } = await supabase
                .from('past_bookings')
                .select(`
                  id, date_time, address, total_cost,
                  first_name, last_name, customer
                `)
                .eq('id', parseInt(log.entity_id))
                .single();
              
              if (pastBooking) {
                enhanced.booking_info = {
                  id: pastBooking.id,
                  date_time: pastBooking.date_time,
                  address: pastBooking.address || 'No address',
                  customer_name: `${pastBooking.first_name || ''} ${pastBooking.last_name || ''}`.trim() || 'Unknown',
                  total_cost: parseFloat(pastBooking.total_cost || '0')
                };
              }
            } catch (pastBookingError) {
              console.warn('Booking not found:', log.entity_id);
            }
          }
        }
        
        // If it's a customer-related log, fetch customer details
        if (log.entity_type === 'customer' && log.entity_id) {
          try {
            const { data: customer } = await supabase
              .from('customers')
              .select('id, first_name, last_name, email')
              .eq('id', parseInt(log.entity_id))
              .single();
            
            if (customer) {
              enhanced.customer_info = customer;
            }
          } catch (customerError) {
            console.warn('Customer not found:', log.entity_id);
          }
        }
        
        // Also check if details contain customer_id or booking_id
        if (log.details && typeof log.details === 'object' && log.details !== null) {
          const details = log.details as Record<string, any>;
          
          if (details.customer_id && !enhanced.customer_info) {
            try {
              const { data: customer } = await supabase
                .from('customers')
                .select('id, first_name, last_name, email')
                .eq('id', parseInt(details.customer_id))
                .single();
              
              if (customer) {
                enhanced.customer_info = customer;
              }
            } catch (customerError) {
              console.warn('Customer not found in details:', details.customer_id);
            }
          }
          
          if (details.booking_id && !enhanced.booking_info) {
            try {
              const { data: booking } = await supabase
                .from('bookings')
                .select(`
                  id, date_time, address, total_cost,
                  first_name, last_name, customer
                `)
                .eq('id', parseInt(details.booking_id))
                .single();
              
              if (booking) {
                enhanced.booking_info = {
                  id: booking.id,
                  date_time: booking.date_time,
                  address: booking.address || 'No address',
                  customer_name: `${booking.first_name || ''} ${booking.last_name || ''}`.trim() || 'Unknown',
                  total_cost: booking.total_cost || 0
                };
              }
            } catch (bookingError) {
              // Try past_bookings
              try {
                const { data: pastBooking } = await supabase
                  .from('past_bookings')
                  .select(`
                    id, date_time, address, total_cost,
                    first_name, last_name, customer
                  `)
                  .eq('id', parseInt(details.booking_id))
                  .single();
                
                if (pastBooking) {
                  enhanced.booking_info = {
                    id: pastBooking.id,
                    date_time: pastBooking.date_time,
                    address: pastBooking.address || 'No address',
                    customer_name: `${pastBooking.first_name || ''} ${pastBooking.last_name || ''}`.trim() || 'Unknown',
                    total_cost: parseFloat(pastBooking.total_cost || '0')
                  };
                }
              } catch (pastBookingError) {
                console.warn('Booking not found in details:', details.booking_id);
              }
            }
          }
        }
        
        return enhanced;
      }));
      
      setLogs(enhancedLogs);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter logs based on search and filters
  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action_type === actionFilter;
    const matchesRole = roleFilter === 'all' || log.user_role === roleFilter;
    
    return matchesSearch && matchesAction && matchesRole;
  });

  // Get unique action types and roles for filters
  const uniqueActions = [...new Set(logs.map(log => log.action_type))];
  const uniqueRoles = [...new Set(logs.map(log => log.user_role))];

  const getActionBadgeVariant = (actionType: string) => {
    if (actionType.includes('created') || actionType.includes('login')) return 'default';
    if (actionType.includes('updated') || actionType.includes('changed')) return 'secondary';
    if (actionType.includes('deleted') || actionType.includes('logout')) return 'destructive';
    if (actionType.includes('page_visit')) return 'outline';
    return 'default';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Logs</CardTitle>
        <div className="flex gap-4 mt-4">
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {uniqueActions.map(action => (
                <SelectItem key={action} value={action}>{action}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {uniqueRoles.map(role => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading activity logs...</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Booking Info</TableHead>
                  <TableHead>Customer Info</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                    </TableCell>
                    <TableCell className="text-sm">{log.user_email || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {log.user_role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action_type)} className="text-xs">
                        {log.action_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.entity_type && (
                        <span className="text-muted-foreground">
                          {log.entity_type}
                          {log.entity_id && ` #${log.entity_id}`}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.booking_info && (
                        <div className="space-y-1">
                          <div className="font-medium">#{log.booking_info.id}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(log.booking_info.date_time), 'MMM dd, HH:mm')}
                          </div>
                          <div className="text-xs text-muted-foreground max-w-32 truncate">
                            {log.booking_info.address}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            £{log.booking_info.total_cost}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.customer_info && (
                        <div className="space-y-1">
                          <div className="font-medium">
                            {log.customer_info.first_name} {log.customer_info.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            #{log.customer_info.id}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {log.customer_info.email}
                          </div>
                        </div>
                      )}
                      {log.booking_info && !log.customer_info && (
                        <div className="text-xs text-muted-foreground">
                          {log.booking_info.customer_name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm max-w-xs">
                      {log.details && (
                        <details className="cursor-pointer">
                          <summary className="text-muted-foreground hover:text-foreground">
                            View details
                          </summary>
                          <pre className="text-xs mt-2 p-2 bg-muted rounded max-h-32 overflow-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredLogs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No activity logs found.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityLogsView;