import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { RefreshCw, Eye, MousePointerClick, FileText, TrendingUp, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

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

type FunnelEventRow = {
  id: string;
  session_id: string;
  event_type: string;
  event_data: unknown;
  page_url: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  created_at: string;
};

interface QuoteLead {
  id: string;
  session_id: string;
  user_id: string | null;
  service_type: string | null;
  postcode: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  calculated_quote: number | null;
  weekly_cost: number | null;
  discount_amount: number | null;
  short_notice_charge: number | null;
  is_first_time_customer: boolean | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  furthest_step: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_heartbeat: string | null;
  quote_email_sent: boolean | null;
  quote_email_sent_at: string | null;
}

// Check if a lead is idle (no heartbeat in last 2 minutes means browser likely closed)
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

  const fetchData = async () => {
    setRefreshing(true);
    try {
      // Fetch both funnel events and quote leads
      const [eventsResponse, leadsResponse] = await Promise.all([
        supabase
          .from('funnel_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('quote_leads')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
      ]);

      if (eventsResponse.error) throw eventsResponse.error;
      if (leadsResponse.error) throw leadsResponse.error;

      setEvents((eventsResponse.data || []).map(e => ({
        ...e,
        event_data: e.event_data as Record<string, unknown> | null
      })));
      setLeads(leadsResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, serviceFilter]);

  // Calculate funnel stats
  const pageViews = events.filter(e => e.event_type === 'page_view').length;
  const serviceClicks = events.filter(e => e.event_type === 'service_click').length;
  const formStarts = events.filter(e => e.event_type === 'form_started').length;
  const quoteViews = leads.filter(l => l.furthest_step === 'quote_viewed' || l.status === 'completed').length;
  const completions = leads.filter(l => l.status === 'completed').length;

  // Calculate conversion rates
  const clickRate = pageViews > 0 ? ((serviceClicks / pageViews) * 100).toFixed(1) : '0';
  const formRate = serviceClicks > 0 ? ((formStarts / serviceClicks) * 100).toFixed(1) : '0';
  const completionRate = leads.length > 0 ? ((completions / leads.length) * 100).toFixed(1) : '0';

  // Get service click breakdown
  const serviceBreakdown = events
    .filter(e => e.event_type === 'service_click')
    .reduce((acc, e) => {
      const service = (e.event_data?.service_id as string) || 'unknown';
      acc[service] = (acc[service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const getStatusBadge = (lead: QuoteLead) => {
    const status = lead.status;
    
    // Check if live but idle (no recent heartbeat)
    if (status === 'live' && isLeadIdle(lead)) {
      return <Badge className="bg-yellow-100 text-yellow-800">Idle</Badge>;
    }
    
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Booked</Badge>;
      case 'left':
        return <Badge className="bg-red-100 text-red-800">Left</Badge>;
      case 'live':
        return <Badge className="bg-blue-100 text-blue-800 animate-pulse">Live</Badge>;
      case 'idle':
        return <Badge className="bg-yellow-100 text-yellow-800">Idle</Badge>;
      case 'viewing':
        return <Badge className="bg-yellow-100 text-yellow-800">Viewing</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status || 'Unknown'}</Badge>;
    }
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
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
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
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('quote_leads')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (error) throw error;
      
      toast.success('All leads deleted');
      setSelectedLeads(new Set());
      fetchData();
    } catch (error) {
      console.error('Error deleting all leads:', error);
      toast.error('Failed to delete leads');
    } finally {
      setDeleting(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    // Handle idle filter - computed status
    if (statusFilter === 'idle') {
      if (!isLeadIdle(lead)) return false;
    } else if (statusFilter === 'live') {
      // Live means currently active (not idle)
      if (lead.status !== 'live' || isLeadIdle(lead)) return false;
    } else if (statusFilter !== 'all' && lead.status !== statusFilter) {
      return false;
    }
    if (serviceFilter !== 'all' && lead.service_type !== serviceFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Funnel Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Page Views</p>
                <p className="text-2xl font-bold">{pageViews}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MousePointerClick className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Service Clicks</p>
                <p className="text-2xl font-bold">{serviceClicks}</p>
                <p className="text-xs text-gray-400">{clickRate}% rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Form Starts</p>
                <p className="text-2xl font-bold">{leads.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Quote Views</p>
                <p className="text-2xl font-bold">{quoteViews}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Completed</p>
                <p className="text-2xl font-bold">{completions}</p>
                <p className="text-xs text-gray-400">{completionRate}% rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Breakdown */}
      {Object.keys(serviceBreakdown).length > 0 && (
        <Card className="rounded-xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Service Clicks Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(serviceBreakdown).map(([service, count]) => (
                <Badge key={service} variant="outline" className="py-1 px-3">
                  {service.replace(/-/g, ' ')}: <span className="font-bold ml-1">{count}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Events and Leads */}
      <Tabs defaultValue="leads" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="leads">Quote Leads ({leads.length})</TabsTrigger>
            <TabsTrigger value="events">All Events ({events.length})</TabsTrigger>
          </TabsList>
          <Button variant="outline" onClick={fetchData} disabled={refreshing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <TabsContent value="leads">
          <Card className="rounded-xl border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex flex-wrap gap-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="live">Live (active)</SelectItem>
                      <SelectItem value="idle">Idle (tab open but inactive)</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="completed">Booked</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={serviceFilter} onValueChange={setServiceFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      <SelectItem value="Air BnB">Air BnB</SelectItem>
                      <SelectItem value="Domestic">Domestic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  {selectedLeads.size > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={deleting}>
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
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" disabled={deleting || leads.length === 0}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete ALL leads?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete ALL {leads.length} leads. This is for testing cleanup only. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAll} className="bg-red-600 hover:bg-red-700">
                          Delete All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox 
                          checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Quote</TableHead>
                      <TableHead>Quote Sent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                          No quote leads found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <Checkbox 
                              checked={selectedLeads.has(lead.id)}
                              onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {lead.created_at ? format(new Date(lead.created_at), 'dd/MM/yy HH:mm') : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{lead.service_type || '-'}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {lead.first_name || lead.last_name ? (
                                <p className="font-medium">{`${lead.first_name || ''} ${lead.last_name || ''}`.trim()}</p>
                              ) : null}
                              {lead.email && (
                                <p className="text-sm text-gray-500">{lead.email}</p>
                              )}
                              {lead.phone && <p className="text-sm text-gray-500">{lead.phone}</p>}
                              {!lead.first_name && !lead.email && !lead.phone && (
                                <span className="text-gray-400">No contact info</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {lead.postcode && <p className="font-medium">{lead.postcode}</p>}
                              {(lead.bedrooms || lead.bathrooms) && (
                                <p className="text-gray-500">
                                  {lead.bedrooms && `${lead.bedrooms} bed`}
                                  {lead.bedrooms && lead.bathrooms && ' / '}
                                  {lead.bathrooms && `${lead.bathrooms} bath`}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {lead.calculated_quote ? (
                                <span className="font-semibold text-green-600">£{lead.calculated_quote.toFixed(0)}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                              {lead.discount_amount && lead.discount_amount > 0 && (
                                <p className="text-xs text-red-500">-£{lead.discount_amount.toFixed(0)} discount</p>
                              )}
                              {lead.is_first_time_customer && (
                                <Badge className="text-xs bg-purple-100 text-purple-700">New customer</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {lead.quote_email_sent ? (
                              <div className="space-y-1">
                                <Badge className="bg-green-100 text-green-800">Sent</Badge>
                                {lead.quote_email_sent_at && (
                                  <p className="text-xs text-gray-400">
                                    {format(new Date(lead.quote_email_sent_at), 'dd/MM HH:mm')}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-gray-400">Not sent</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(lead)}
                            {lead.furthest_step && (
                              <p className="text-xs text-gray-400 mt-1">Step: {lead.furthest_step}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            {lead.utm_source || lead.utm_campaign ? (
                              <div className="text-xs">
                                {lead.utm_source && <p>{lead.utm_source}</p>}
                                {lead.utm_campaign && <p className="text-gray-400">{lead.utm_campaign}</p>}
                              </div>
                            ) : (
                              <span className="text-gray-400">Direct</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card className="rounded-xl border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          No events tracked yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      events.slice(0, 100).map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(event.created_at), 'dd/MM/yy HH:mm:ss')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              event.event_type === 'page_view' ? 'secondary' :
                              event.event_type === 'service_click' ? 'default' : 'outline'
                            }>
                              {event.event_type.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {JSON.stringify(event.event_data || {})}
                            </code>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 font-mono">
                            {event.session_id.substring(0, 12)}...
                          </TableCell>
                          <TableCell>
                            {event.utm_source ? (
                              <span className="text-xs">{event.utm_source}</span>
                            ) : (
                              <span className="text-gray-400 text-xs">Direct</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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
