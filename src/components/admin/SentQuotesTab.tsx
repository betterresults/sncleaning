import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays, startOfDay, endOfDay, subWeeks, subMonths, isWithinInterval } from 'date-fns';
import { 
  RefreshCw, Copy, ExternalLink,
  User, Mail, Phone, MapPin, Home, Bath, BedDouble, 
  Calendar, Clock, Sparkles, Building2, PoundSterling,
  ChevronLeft, ChevronRight, ArrowUpDown, Send
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

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

interface SentQuote {
  id: string;
  session_id: string;
  short_code: string;
  service_type: string | null;
  property_type: string | null;
  postcode: string | null;
  address: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  toilets: number | null;
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
  first_deep_clean: boolean | null;
  status: string | null;
  created_at: string | null;
  created_by_admin_id: string | null;
  agent_user_id: string | null;
  converted_booking_id: number | null;
  oven_cleaning: boolean | null;
  oven_size: string | null;
  property_access: string | null;
  access_notes: string | null;
  short_notice_charge: number | null;
}

interface AdminProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface SentQuotesTabProps {
  agentUserId?: string | null;
  isAgent?: boolean;
}

const SentQuotesTab: React.FC<SentQuotesTabProps> = ({ agentUserId, isAgent = false }) => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<SentQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminProfiles, setAdminProfiles] = useState<Map<string, AdminProfile>>(new Map());
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('last_month');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const fetchData = async () => {
    setRefreshing(true);
    try {
      let query = supabase
        .from('quote_leads')
        .select('*')
        .not('short_code', 'is', null)
        .order('created_at', { ascending: false })
        .limit(200);
      
      // Filter by agent if specified
      if (isAgent && agentUserId) {
        query = query.eq('agent_user_id', agentUserId);
      } else {
        // For admins, show quotes created by any admin/agent
        query = query.or('created_by_admin_id.not.is.null,agent_user_id.not.is.null');
      }

      const [quotesResponse, profilesResponse] = await Promise.all([
        query,
        supabase.from('profiles').select('user_id, first_name, last_name, email')
      ]);

      if (quotesResponse.error) throw quotesResponse.error;

      setQuotes(quotesResponse.data || []);

      if (profilesResponse.data) {
        const profilesMap = new Map<string, AdminProfile>();
        profilesResponse.data.forEach(p => {
          profilesMap.set(p.user_id, p);
        });
        setAdminProfiles(profilesMap);
      }
    } catch (error) {
      console.error('Error fetching sent quotes:', error);
      toast.error('Failed to load sent quotes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const getBookingLink = (quote: SentQuote): string => {
    return `https://account.sncleaningservices.co.uk/b/${quote.short_code}`;
  };

  const handleCopyLink = async (quote: SentQuote, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const link = getBookingLink(quote);
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handlePreview = (quote: SentQuote, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const link = getBookingLink(quote);
    window.open(link, '_blank');
  };

  // Navigate to booking form with quote data for editing
  const handleEditQuote = (quote: SentQuote) => {
    // Build URL params to prefill the form
    const params = new URLSearchParams();
    
    // Quote identification
    params.set('editQuoteId', quote.id);
    params.set('ref', quote.session_id);
    
    // Customer details
    if (quote.first_name) params.set('firstName', quote.first_name);
    if (quote.last_name) params.set('lastName', quote.last_name);
    if (quote.email) params.set('email', quote.email);
    if (quote.phone) params.set('phone', quote.phone);
    
    // Property details
    if (quote.property_type) params.set('propertyType', quote.property_type.toLowerCase());
    if (quote.bedrooms) params.set('bedrooms', quote.bedrooms.toString());
    if (quote.bathrooms) params.set('bathrooms', quote.bathrooms.toString());
    if (quote.toilets) params.set('toilets', quote.toilets.toString());
    if (quote.postcode) params.set('postcode', quote.postcode);
    if (quote.address) params.set('address', quote.address);
    if (quote.property_access) params.set('propertyAccess', quote.property_access);
    if (quote.access_notes) params.set('accessNotes', quote.access_notes);
    
    // Service details
    if (quote.frequency) params.set('frequency', quote.frequency.toLowerCase());
    if (quote.oven_cleaning) params.set('oven', '1');
    if (quote.oven_size) params.set('ovenType', quote.oven_size);
    
    // Schedule
    if (quote.selected_date) params.set('date', quote.selected_date);
    if (quote.selected_time) params.set('time', quote.selected_time);
    if (quote.is_flexible) params.set('flexibility', 'flexible-time');
    
    // Pricing
    if (quote.calculated_quote) params.set('quotedCost', quote.calculated_quote.toString());
    if (quote.recommended_hours) params.set('quotedHours', quote.recommended_hours.toString());
    if (quote.short_notice_charge) params.set('shortNotice', quote.short_notice_charge.toString());
    
    // First deep clean / recurring
    if (quote.first_deep_clean) {
      params.set('firstDeepClean', '1');
      if (quote.weekly_hours) params.set('weeklyHours', quote.weekly_hours.toString());
      if (quote.weekly_cost) params.set('weeklyCost', quote.weekly_cost.toString());
    }
    
    // Navigate to admin domestic form with edit mode
    navigate(`/admin/domestic?${params.toString()}`);
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

  const filteredQuotes = filterByTimePeriod(quotes)
    .sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  // Pagination
  const totalPages = Math.ceil(filteredQuotes.length / ITEMS_PER_PAGE);
  const paginatedQuotes = filteredQuotes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [timePeriod, sortOrder]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="rounded-2xl border border-gray-100 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
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
              
              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'newest' | 'oldest')}>
                <SelectTrigger className="w-[140px] bg-white rounded-xl border-gray-200">
                  <ArrowUpDown className="h-4 w-4 mr-2 text-gray-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {filteredQuotes.length} quotes
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchData} 
                disabled={refreshing}
                className="gap-1"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quote Cards */}
      {paginatedQuotes.length === 0 ? (
        <Card className="rounded-2xl border border-gray-100 shadow-sm">
          <CardContent className="p-12 text-center text-gray-400">
            <div className="flex flex-col items-center gap-2">
              <Send className="h-12 w-12 text-gray-300" />
              <p className="text-lg font-medium">No sent quotes found</p>
              <p className="text-sm">Quotes you send to customers will appear here</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {paginatedQuotes.map((quote) => (
            <Card 
              key={quote.id} 
              className={`rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md cursor-pointer ${
                quote.converted_booking_id ? 'border-l-4 border-l-green-500 bg-green-50/30' : 'border-gray-100'
              }`}
              onClick={() => handleEditQuote(quote)}
            >
              <CardContent className="p-4 space-y-3">
                {/* Header Row */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    {/* Service Type */}
                    <Badge variant="outline" className={
                      quote.service_type?.toLowerCase().includes('airbnb') 
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-sky-50 text-sky-700 border-sky-200'
                    }>
                      {quote.service_type?.toLowerCase().includes('airbnb') 
                        ? <Building2 className="h-3 w-3 mr-1" />
                        : <Home className="h-3 w-3 mr-1" />
                      }
                      {quote.service_type || 'Unknown'}
                    </Badge>
                    
                    {/* Status */}
                    {quote.converted_booking_id ? (
                      <Badge className="bg-green-100 text-green-700 border-0">
                        Booked #{quote.converted_booking_id}
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700 border-0">
                        Pending
                      </Badge>
                    )}

                    {/* Sent by */}
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      by {getAdminName(quote.created_by_admin_id || quote.agent_user_id)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleCopyLink(quote, e)}
                      className="gap-1 text-xs"
                    >
                      <Copy className="h-3 w-3" />
                      Copy Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handlePreview(quote, e)}
                      className="gap-1 text-xs"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Preview
                    </Button>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="flex items-center gap-4 flex-wrap text-sm bg-white/60 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                    <User className="h-4 w-4 text-gray-400" />
                    {quote.first_name || quote.last_name 
                      ? `${quote.first_name || ''} ${quote.last_name || ''}`.trim()
                      : <span className="text-gray-400 italic">No name</span>
                    }
                  </div>
                  {quote.email && (
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {quote.email}
                    </div>
                  )}
                  {quote.phone && (
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {quote.phone}
                    </div>
                  )}
                </div>

                {/* Property & Quote Details */}
                <div className="flex items-center gap-3 flex-wrap text-sm">
                  {quote.property_type && (
                    <Badge className="bg-slate-200 text-slate-700 border-0 gap-1">
                      <Home className="h-3 w-3" />
                      {quote.property_type}
                    </Badge>
                  )}
                  
                  {quote.postcode && (
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1">
                      <MapPin className="h-3 w-3 text-slate-500" />
                      <span className="text-slate-700">{quote.postcode}</span>
                    </div>
                  )}
                  
                  {(quote.bedrooms || quote.bathrooms) && (
                    <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-2 py-1">
                      {quote.bedrooms && (
                        <span className="flex items-center gap-1 text-slate-700">
                          <BedDouble className="h-3 w-3" />
                          {quote.bedrooms}
                        </span>
                      )}
                      {quote.bathrooms && (
                        <span className="flex items-center gap-1 text-slate-700">
                          <Bath className="h-3 w-3" />
                          {quote.bathrooms}
                        </span>
                      )}
                    </div>
                  )}

                  {quote.frequency && (
                    <Badge className="bg-violet-100 text-violet-700 border-0">
                      {quote.frequency}
                    </Badge>
                  )}

                  {quote.first_deep_clean && (
                    <Badge className="bg-teal-100 text-teal-700 border-0 gap-1">
                      <Sparkles className="h-3 w-3" />
                      First Deep Clean
                    </Badge>
                  )}
                </div>

                {/* Schedule & Pricing */}
                <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm">
                    {quote.selected_date && (
                      <Badge className="bg-blue-100 text-blue-700 border-0 gap-1">
                        <Calendar className="h-3 w-3" />
                        {quote.selected_date}
                      </Badge>
                    )}
                    {quote.selected_time ? (
                      <Badge className="bg-cyan-100 text-cyan-700 border-0 gap-1">
                        <Clock className="h-3 w-3" />
                        {quote.selected_time}
                      </Badge>
                    ) : quote.is_flexible ? (
                      <Badge className="bg-gray-100 text-gray-600 border-0">
                        Time: TBC (Flexible)
                      </Badge>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    {quote.recommended_hours && (
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {quote.recommended_hours}h
                      </span>
                    )}
                    {quote.calculated_quote && (
                      <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">
                        <PoundSterling className="h-4 w-4" />
                        £{quote.calculated_quote.toFixed(2)}
                      </div>
                    )}
                    {quote.weekly_cost && quote.weekly_cost !== quote.calculated_quote && (
                      <span className="text-sm text-gray-500">
                        (then £{quote.weekly_cost.toFixed(2)}/visit)
                      </span>
                    )}
                  </div>
                </div>

                {/* Short Link */}
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  <span className="font-mono">
                    account.sncleaningservices.co.uk/b/{quote.short_code}
                  </span>
                  <span className="ml-auto">
                    Sent {quote.created_at && format(new Date(quote.created_at), 'dd MMM yyyy, HH:mm')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100">
          <p className="text-sm text-gray-500">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredQuotes.length)} of {filteredQuotes.length} quotes
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
    </div>
  );
};

export default SentQuotesTab;
