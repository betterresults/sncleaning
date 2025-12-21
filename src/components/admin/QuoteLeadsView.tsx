import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays, startOfDay, endOfDay, subWeeks, subMonths, isWithinInterval } from 'date-fns';
import { RefreshCw, Eye, MousePointerClick, TrendingUp, Trash2, Users, CheckCircle2, Home, Building, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import QuoteLeadCard from './QuoteLeadCard';

type TimePeriod = 'today' | 'yesterday' | 'last_week' | 'last_month' | 'last_3_months' | 'all';

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_week', label: 'Last 7 days' },
  { value: 'last_month', label: 'Last 30 days' },
  { value: 'last_3_months', label: 'Last 3 months' },
  { value: 'all', label: 'All time' },
];

const getDateRange = (period: TimePeriod): { start: Date; end: Date } | null => {
  const now = new Date();
  switch (period) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'yesterday':
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    case 'last_week':
      return { start: startOfDay(subWeeks(now, 1)), end: endOfDay(now) };
    case 'last_month':
      return { start: startOfDay(subMonths(now, 1)), end: endOfDay(now) };
    case 'last_3_months':
      return { start: startOfDay(subMonths(now, 3)), end: endOfDay(now) };
    case 'all':
    default:
      return null;
  }
};

const ITEMS_PER_PAGE = 10;

interface FunnelEvent {
  id: string;
  session_id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  page_url: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  created_at: string;
}

interface QuoteLead {
  id: string;
  session_id: string;
  user_id: string | null;
  service_type: string | null;
  cleaning_type: string | null;
  property_type: string | null;
  postcode: string | null;
  address: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  toilets: number | null;
  reception_rooms: number | null;
  kitchen: string | null;
  additional_rooms: unknown | null;
  oven_cleaning: boolean | null;
  oven_size: string | null;
  ironing_hours: number | null;
  frequency: string | null;
  selected_date: string | null;
  selected_time: string | null;
  is_flexible: boolean | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  calculated_quote: number | null;
  recommended_hours: number | null;
  weekly_cost: number | null;
  weekly_hours: number | null;
  discount_amount: number | null;
  short_notice_charge: number | null;
  is_first_time_customer: boolean | null;
  first_deep_clean: boolean | null;
  property_access: string | null;
  access_notes: string | null;
  cleaning_products: string[] | null;
  equipment_arrangement: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  page_url: string | null;
  referrer: string | null;
  user_agent: string | null;
  source: string | null;
  status: string | null;
  furthest_step: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_heartbeat: string | null;
  quote_email_sent: boolean | null;
  quote_email_sent_at: string | null;
  confirmation_sent_at: string | null;
  confirmed_at: string | null;
  expires_at: string | null;
  created_by_admin_id: string | null;
  converted_booking_id: number | null;
  short_code: string | null;
  agent_user_id: string | null;
}

interface AdminProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

const isLeadIdle = (lead: QuoteLead): boolean => {
  if (lead.status !== 'live') return false;
  if (!lead.last_heartbeat) return true;
  
  const heartbeatTime = new Date(lead.last_heartbeat).getTime();
  const now = Date.now();
  const twoMinutes = 2 * 60 * 1000;
  
  return (now - heartbeatTime) > twoMinutes;
};

const QuoteLeadsView = () => {
  const [leads, setLeads] = useState<QuoteLead[]>([]);
  const [events, setEvents] = useState<FunnelEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [adminProfiles, setAdminProfiles] = useState<Map<string, AdminProfile>>(new Map());
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [eventsResponse, leadsResponse, profilesResponse] = await Promise.all([
        supabase
          .from('funnel_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('quote_leads')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('profiles')
          .select('user_id, first_name, last_name, email')
      ]);

      if (eventsResponse.error) throw eventsResponse.error;
      if (leadsResponse.error) throw leadsResponse.error;

      setEvents((eventsResponse.data || []).map(e => ({
        ...e,
        event_data: e.event_data as Record<string, unknown> | null
      })));
      setLeads(leadsResponse.data || []);

      if (profilesResponse.data) {
        const profilesMap = new Map<string, AdminProfile>();
        profilesResponse.data.forEach(p => {
          profilesMap.set(p.user_id, p);
        });
        setAdminProfiles(profilesMap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getAdminName = (adminId: string | null): string => {
    if (!adminId) return '-';
    const profile = adminProfiles.get(adminId);
    if (profile) {
      if (profile.first_name || profile.last_name) {
        return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
      }
      return profile.email || 'Admin';
    }
    return 'Admin';
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, serviceFilter]);

  const getServiceIcon = (serviceId: string) => {
    if (serviceId.includes('airbnb') || serviceId.includes('air-bnb')) {
      return <Building className="h-4 w-4" />;
    }
    return <Home className="h-4 w-4" />;
  };

  const getServiceColor = (serviceId: string) => {
    if (serviceId.includes('airbnb') || serviceId.includes('air-bnb')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-sky-50 text-sky-700 border-sky-200';
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    setSelectedLeads(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(leadId);
      } else {
        newSet.delete(leadId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(new Set(paginatedLeads.map(l => l.id)));
    } else {
      setSelectedLeads(new Set());
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedLeads.size === 0) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('quote_leads')
        .delete()
        .in('id', Array.from(selectedLeads));
      
      if (error) throw error;
      
      toast.success(`Deleted ${selectedLeads.size} lead(s)`);
      setSelectedLeads(new Set());
      fetchData();
    } catch (error) {
      console.error('Error deleting leads:', error);
      toast.error('Failed to delete leads');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('quote_leads')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) throw error;
      
      toast.success('All leads deleted');
      setSelectedLeads(new Set());
      setDeleteConfirmText('');
      fetchData();
    } catch (error) {
      console.error('Error deleting all leads:', error);
      toast.error('Failed to delete leads');
    } finally {
      setDeleting(false);
    }
  };

  // Filter by time period
  const filterByTimePeriod = <T extends { created_at: string | null }>(items: T[]): T[] => {
    const range = getDateRange(timePeriod);
    if (!range) return items;
    return items.filter(item => {
      if (!item.created_at) return false;
      const date = new Date(item.created_at);
      return isWithinInterval(date, { start: range.start, end: range.end });
    });
  };

  const timeFilteredLeads = filterByTimePeriod(leads);
  const timeFilteredEvents = filterByTimePeriod(events);

  const filteredLeads = timeFilteredLeads.filter(lead => {
    if (statusFilter === 'email_sent') {
      if (!lead.quote_email_sent) return false;
    } else if (statusFilter === 'idle') {
      if (!isLeadIdle(lead)) return false;
    } else if (statusFilter === 'live') {
      if (lead.status !== 'live' || isLeadIdle(lead)) return false;
    } else if (statusFilter !== 'all' && lead.status !== statusFilter) {
      return false;
    }
    if (serviceFilter !== 'all' && lead.service_type !== serviceFilter) return false;
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, serviceFilter, timePeriod]);

  // Calculate funnel stats from time-filtered data
  const pageViews = timeFilteredEvents.filter(e => e.event_type === 'page_view').length;
  const serviceClicks = timeFilteredEvents.filter(e => e.event_type === 'service_click').length;
  const quoteViews = timeFilteredLeads.filter(l => l.furthest_step === 'quote_viewed' || l.status === 'completed').length;
  const completions = timeFilteredLeads.filter(l => l.status === 'completed').length;
  const liveLeads = timeFilteredLeads.filter(l => l.status === 'live' && !isLeadIdle(l)).length;
  
  // Booking attempt stats
  const bookingAttempts = timeFilteredLeads.filter(l => l.furthest_step === 'booking_attempted' || l.furthest_step === 'booking_completed').length;
  const successfulBookings = timeFilteredLeads.filter(l => l.status === 'completed').length;
  const failedAttempts = bookingAttempts - successfulBookings;

  // Calculate conversion rates
  const clickRate = pageViews > 0 ? ((serviceClicks / pageViews) * 100).toFixed(1) : '0';
  const completionRate = timeFilteredLeads.length > 0 ? ((completions / timeFilteredLeads.length) * 100).toFixed(1) : '0';

  // Get service click breakdown
  const serviceBreakdown = timeFilteredEvents
    .filter(e => e.event_type === 'service_click')
    .reduce((acc, e) => {
      const service = (e.event_data?.service_id as string) || 'unknown';
      acc[service] = (acc[service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-32 rounded-2xl" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
            <SelectTrigger className="w-[150px] bg-white rounded-xl border-gray-200">
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {TIME_PERIODS.map(period => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchData} 
          disabled={refreshing} 
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-blue-600/80">Page Views</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-700 mt-1">{pageViews}</p>
              </div>
              <div className="p-2.5 bg-blue-100 rounded-xl">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-purple-600/80">Service Clicks</p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-700 mt-1">{serviceClicks}</p>
                <p className="text-xs text-purple-500 mt-0.5">{clickRate}% rate</p>
              </div>
              <div className="p-2.5 bg-purple-100 rounded-xl">
                <MousePointerClick className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-amber-600/80">Booking Attempts</p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-700 mt-1">{bookingAttempts}</p>
                {bookingAttempts > 0 && (
                  <div className="text-xs mt-0.5 space-y-0.5">
                    <p className="text-green-600">{successfulBookings} completed</p>
                    {failedAttempts > 0 && (
                      <p className="text-red-500">{failedAttempts} failed</p>
                    )}
                  </div>
                )}
              </div>
              <div className="p-2.5 bg-amber-100 rounded-xl">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-teal-50 to-white">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-teal-600/80">Quote Views</p>
                <p className="text-2xl sm:text-3xl font-bold text-teal-700 mt-1">{quoteViews}</p>
              </div>
              <div className="p-2.5 bg-teal-100 rounded-xl">
                <TrendingUp className="h-5 w-5 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-green-600/80">Completed</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-700 mt-1">{completions}</p>
                <p className="text-xs text-green-500 mt-0.5">{completionRate}% rate</p>
              </div>
              <div className="p-2.5 bg-green-100 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Breakdown */}
      {Object.keys(serviceBreakdown).length > 0 && (
        <Card className="rounded-2xl border border-gray-100 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Service Interest</h3>
              <span className="text-xs text-gray-400">Click distribution</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(serviceBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([service, count]) => {
                  const total = Object.values(serviceBreakdown).reduce((a, b) => a + b, 0);
                  const percentage = ((count / total) * 100).toFixed(0);
                  return (
                    <div 
                      key={service} 
                      className={`flex items-center gap-3 p-3 rounded-xl border ${getServiceColor(service)}`}
                    >
                      <div className="p-2 rounded-lg bg-white/50">
                        {getServiceIcon(service)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium capitalize truncate">
                          {service.replace(/-/g, ' ')}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-white/50 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-current opacity-50 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold">{count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leads Section */}
      <Tabs defaultValue="leads" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList className="bg-gray-100/80 p-1 rounded-xl">
            <TabsTrigger value="leads" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4">
              Quote Leads ({filteredLeads.length})
            </TabsTrigger>
            <TabsTrigger value="events" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4">
              Events ({timeFilteredEvents.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="leads" className="space-y-4">
          {/* Filters & Actions */}
          <Card className="rounded-2xl border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
                <div className="flex flex-wrap gap-2 items-center">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px] bg-white rounded-xl border-gray-200">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="email_sent">Email Sent</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="idle">Idle</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={serviceFilter} onValueChange={setServiceFilter}>
                    <SelectTrigger className="w-[140px] bg-white rounded-xl border-gray-200">
                      <SelectValue placeholder="All Services" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">All Services</SelectItem>
                      <SelectItem value="Air BnB">Air BnB</SelectItem>
                      <SelectItem value="Domestic">Domestic</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {paginatedLeads.length > 0 && (
                    <div className="flex items-center gap-2 ml-2">
                      <Checkbox 
                        checked={selectedLeads.size === paginatedLeads.length && paginatedLeads.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm text-gray-500">Select all</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {selectedLeads.size > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={deleting} className="rounded-xl">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete ({selectedLeads.size})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete selected leads?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete {selectedLeads.size} selected lead(s). This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteSelected} className="bg-red-600 hover:bg-red-700">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  
                  <AlertDialog onOpenChange={(open) => !open && setDeleteConfirmText('')}>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 rounded-xl" disabled={deleting || leads.length === 0}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600">Delete ALL leads?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                          <span className="block">This will permanently delete <strong>ALL {leads.length} leads</strong>. This action <strong>cannot be undone</strong>.</span>
                          <span className="block font-medium">Type <code className="bg-red-100 px-2 py-0.5 rounded text-red-700">DELETE</code> to confirm:</span>
                          <input 
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="Type DELETE to confirm"
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteAll} 
                          className="bg-red-600 hover:bg-red-700"
                          disabled={deleteConfirmText !== 'DELETE'}
                        >
                          Delete All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lead Cards */}
          {paginatedLeads.length === 0 ? (
            <Card className="rounded-2xl border border-gray-100 shadow-sm">
              <CardContent className="p-12 text-center text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-12 w-12 text-gray-300" />
                  <p className="text-lg font-medium">No quote leads found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {paginatedLeads.map((lead) => (
                <QuoteLeadCard
                  key={lead.id}
                  lead={lead}
                  adminName={getAdminName(lead.created_by_admin_id || lead.agent_user_id)}
                  isSelected={selectedLeads.has(lead.id)}
                  onSelect={(checked) => handleSelectLead(lead.id, checked)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100">
              <p className="text-sm text-gray-500">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredLeads.length)} of {filteredLeads.length} leads
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 rounded-lg ${currentPage === pageNum ? 'bg-primary text-primary-foreground' : ''}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="events">
          <Card className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                      <TableHead className="font-semibold text-gray-600">Time</TableHead>
                      <TableHead className="font-semibold text-gray-600">Event</TableHead>
                      <TableHead className="font-semibold text-gray-600">Session</TableHead>
                      <TableHead className="font-semibold text-gray-600">Source</TableHead>
                      <TableHead className="font-semibold text-gray-600">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeFilteredEvents.slice(0, 50).map((event) => (
                      <TableRow key={event.id} className="hover:bg-gray-50/50">
                        <TableCell className="text-sm">
                          <div>
                            <p className="font-medium text-gray-900">{format(new Date(event.created_at), 'dd MMM')}</p>
                            <p className="text-gray-400 text-xs">{format(new Date(event.created_at), 'HH:mm:ss')}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize bg-gray-50">
                            {event.event_type.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {event.session_id.slice(-8)}
                          </code>
                        </TableCell>
                        <TableCell>
                          {event.utm_source ? (
                            <Badge variant="outline" className="capitalize text-xs">{event.utm_source}</Badge>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {event.event_data && Object.keys(event.event_data).length > 0 ? (
                            <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded block max-w-[200px] truncate">
                              {JSON.stringify(event.event_data)}
                            </code>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuoteLeadsView;