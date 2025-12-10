import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Search, RefreshCw, TrendingUp, Users, DollarSign, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface QuoteLead {
  id: string;
  session_id: string;
  service_type: string | null;
  postcode: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  calculated_quote: number | null;
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
}

const QuoteLeadsView = () => {
  const [leads, setLeads] = useState<QuoteLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('quote_leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (serviceFilter !== 'all') {
        query = query.eq('service_type', serviceFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching quote leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, serviceFilter]);

  const filteredLeads = leads.filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (lead.email?.toLowerCase().includes(searchLower) || false) ||
      (lead.first_name?.toLowerCase().includes(searchLower) || false) ||
      (lead.last_name?.toLowerCase().includes(searchLower) || false) ||
      (lead.postcode?.toLowerCase().includes(searchLower) || false) ||
      (lead.phone?.includes(searchTerm) || false)
    );
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'abandoned':
        return <Badge className="bg-red-100 text-red-800">Abandoned</Badge>;
      case 'viewing':
        return <Badge className="bg-yellow-100 text-yellow-800">Viewing</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status || 'Unknown'}</Badge>;
    }
  };

  // Calculate stats
  const totalLeads = leads.length;
  const completedLeads = leads.filter(l => l.status === 'completed').length;
  const averageQuote = leads.reduce((sum, l) => sum + (l.calculated_quote || 0), 0) / (leads.filter(l => l.calculated_quote).length || 1);
  const conversionRate = totalLeads > 0 ? ((completedLeads / totalLeads) * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Leads</p>
                <p className="text-2xl font-bold">{totalLeads}</p>
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
                <p className="text-sm text-gray-500">Conversion Rate</p>
                <p className="text-2xl font-bold">{conversionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Quote</p>
                <p className="text-2xl font-bold">£{averageQuote.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold">{completedLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-xl border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Quote Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, postcode, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="viewing">Viewing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="abandoned">Abandoned</SelectItem>
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
            <Button variant="outline" onClick={fetchLeads} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Quote</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No quote leads found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
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
                          {lead.email && <p className="text-sm text-gray-500">{lead.email}</p>}
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
                        {lead.calculated_quote ? (
                          <span className="font-semibold text-green-600">£{lead.calculated_quote.toFixed(0)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(lead.status)}
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
    </div>
  );
};

export default QuoteLeadsView;
