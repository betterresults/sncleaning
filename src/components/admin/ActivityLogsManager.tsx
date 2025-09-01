import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  User, 
  Calendar, 
  CreditCard, 
  UserPlus, 
  Edit, 
  Trash2, 
  LogIn, 
  LogOut,
  Search,
  Filter,
  RefreshCw,
  Package
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ActivityLog {
  id: string;
  user_id: string;
  user_email: string;
  user_role: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

const ActivityLogsManager = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const { toast } = useToast();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (filterAction !== 'all') {
        query = query.eq('action_type', filterAction);
      }

      if (filterUser !== 'all') {
        query = query.eq('user_role', filterUser);
      }

      if (dateFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte('created_at', today.toISOString());
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('created_at', weekAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch activity logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterAction, filterUser, dateFilter]);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'login':
        return <LogIn className="h-4 w-4 text-green-600" />;
      case 'logout':
        return <LogOut className="h-4 w-4 text-gray-600" />;
      case 'booking_created':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'booking_cancelled':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'booking_status_changed':
        return <Edit className="h-4 w-4 text-yellow-600" />;
      case 'customer_created':
        return <UserPlus className="h-4 w-4 text-green-600" />;
      case 'customer_updated':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'payment_method_added':
        return <CreditCard className="h-4 w-4 text-green-600" />;
      case 'payment_method_removed':
        return <CreditCard className="h-4 w-4 text-red-600" />;
      case 'linen_order_created':
      case 'linen_order_status_changed':
      case 'linen_order_payment_status_changed':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'linen_inventory_updated':
        return <Package className="h-4 w-4 text-yellow-600" />;
      case 'cleaner_rates_updated':
      case 'cleaner_contact_updated':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'sub_cleaner_assigned':
      case 'sub_cleaner_removed':
        return <UserPlus className="h-4 w-4 text-green-600" />;
      case 'pricing_formula_created':
      case 'pricing_formula_updated':
      case 'pricing_formula_deleted':
        return <Edit className="h-4 w-4 text-purple-600" />;
      case 'user_role_assigned':
      case 'user_role_changed':
      case 'user_role_removed':
        return <UserPlus className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case 'login':
      case 'customer_created':
      case 'booking_created':
      case 'payment_method_added':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'logout':
      case 'customer_updated':
      case 'booking_status_changed':
        return <Badge variant="secondary">Update</Badge>;
      case 'booking_cancelled':
      case 'payment_method_removed':
        return <Badge variant="destructive">Removed</Badge>;
      case 'linen_order_created':
      case 'pricing_formula_created':
      case 'sub_cleaner_assigned':
      case 'user_role_assigned':
        return <Badge className="bg-green-100 text-green-800">Created</Badge>;
      case 'linen_order_status_changed':
      case 'linen_order_payment_status_changed':
      case 'linen_inventory_updated':
      case 'cleaner_rates_updated':
      case 'cleaner_contact_updated':
      case 'pricing_formula_updated':
      case 'user_role_changed':
        return <Badge variant="secondary">Updated</Badge>;
      case 'pricing_formula_deleted':
      case 'sub_cleaner_removed':
      case 'user_role_removed':
        return <Badge variant="destructive">Deleted</Badge>;
      default:
        return <Badge variant="outline">Action</Badge>;
    }
  };

  const formatActionText = (log: ActivityLog) => {
    const details = log.details || {};
    
    switch (log.action_type) {
      case 'booking_created':
        return `Created booking for ${details.customer_email} - £${details.total_cost}`;
      case 'booking_cancelled':
        return `Cancelled booking for ${details.customer_email}`;
      case 'booking_status_changed':
        return `Changed booking status from ${details.old_status} to ${details.new_status}`;
      case 'customer_created':
        return `Created customer: ${details.name} (${details.email})`;
      case 'customer_updated':
        return `Updated customer: ${details.name}`;
      case 'payment_method_added':
        return `Added ${details.card_brand} card ending in ${details.card_last4}`;
      case 'payment_method_removed':
        return `Removed ${details.card_brand} card ending in ${details.card_last4}`;
      case 'login':
        return `User logged in`;
      case 'logout':
        return `User logged out`;
      case 'linen_order_created':
        return `Created linen order - £${details.total_cost} (Customer ID: ${details.customer_id})`;
      case 'linen_order_status_changed':
        return `Changed linen order status from ${details.old_status} to ${details.new_status}`;
      case 'linen_order_payment_status_changed':
        return `Changed linen order payment status from ${details.old_payment_status} to ${details.new_payment_status}`;
      case 'linen_order_cost_updated':
        return `Updated linen order cost from £${details.old_total_cost} to £${details.new_total_cost}`;
      case 'linen_inventory_updated':
        return `Updated linen inventory - Clean: ${details.old_clean}→${details.new_clean}, Dirty: ${details.old_dirty}→${details.new_dirty}`;
      case 'cleaner_rates_updated':
        return `Updated ${details.name} rates - Hourly: £${details.old_hourly_rate}→£${details.new_hourly_rate}, Percentage: ${details.old_percentage_rate}%→${details.new_percentage_rate}%`;
      case 'cleaner_contact_updated':
        return `Updated ${details.name} contact info`;
      case 'sub_cleaner_assigned':
        return `Assigned sub-cleaner to booking ${details.primary_booking_id} - ${details.hours_assigned} hours, £${details.cleaner_pay} pay`;
      case 'sub_cleaner_removed':
        return `Removed sub-cleaner from booking ${details.primary_booking_id}`;
      case 'pricing_formula_created':
        return `Created pricing formula: ${details.formula_name} for ${details.service_type}`;
      case 'pricing_formula_updated':
        return `Updated pricing formula: ${details.formula_name} - Rate: £${details.old_base_rate}→£${details.new_base_rate}`;
      case 'pricing_formula_deleted':
        return `Deleted pricing formula: ${details.formula_name}`;
      case 'user_role_assigned':
        return `Assigned role ${details.role} to user`;
      case 'user_role_changed':
        return `Changed user role from ${details.old_role} to ${details.new_role}`;
      case 'user_role_removed':
        return `Removed role ${details.role} from user`;
      default:
        return log.action_type.replace(/_/g, ' ');
    }
  };

  const filteredLogs = logs.filter(log => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        log.user_email?.toLowerCase().includes(searchLower) ||
        log.action_type.toLowerCase().includes(searchLower) ||
        formatActionText(log).toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Activity Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="booking_created">Booking Created</SelectItem>
                <SelectItem value="booking_cancelled">Booking Cancelled</SelectItem>
                <SelectItem value="booking_status_changed">Status Changed</SelectItem>
                <SelectItem value="customer_created">Customer Created</SelectItem>
                <SelectItem value="customer_updated">Customer Updated</SelectItem>
                <SelectItem value="payment_method_added">Payment Added</SelectItem>
        <SelectItem value="pricing_formula_created">Formula Created</SelectItem>
        <SelectItem value="pricing_formula_updated">Formula Updated</SelectItem>
        <SelectItem value="pricing_formula_deleted">Formula Deleted</SelectItem>
        <SelectItem value="linen_order_created">Linen Order Created</SelectItem>
        <SelectItem value="linen_order_status_changed">Linen Status Changed</SelectItem>
        <SelectItem value="linen_order_payment_status_changed">Linen Payment Changed</SelectItem>
        <SelectItem value="linen_inventory_updated">Inventory Updated</SelectItem>
        <SelectItem value="cleaner_rates_updated">Cleaner Rates Updated</SelectItem>
        <SelectItem value="sub_cleaner_assigned">Sub-Cleaner Assigned</SelectItem>
        <SelectItem value="user_role_assigned">Role Assigned</SelectItem>
        <SelectItem value="user_role_changed">Role Changed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="user">Cleaners</SelectItem>
                <SelectItem value="guest">Customers</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={fetchLogs} 
              variant="outline" 
              className="flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Activity List */}
          {loading ? (
            <div className="text-center py-8">Loading activity logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activity logs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getActionIcon(log.action_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {log.user_email || 'Unknown User'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {log.user_role || 'unknown'}
                        </Badge>
                        {getActionBadge(log.action_type)}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                    
                    <p className="text-sm text-foreground">
                      {formatActionText(log)}
                    </p>
                    
                    {log.entity_type && log.entity_id && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>
                          {log.entity_type}: {log.entity_id.slice(0, 8)}...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLogsManager;