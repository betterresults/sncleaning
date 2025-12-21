import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  User, Mail, Phone, MapPin, Home, Bath, BedDouble, 
  Calendar, Clock, Sparkles, Building2, 
  CheckCircle2, XCircle, AlertCircle, CookingPot, Shirt, 
  Sofa, DoorOpen, Globe, Zap, ArrowRight,
  Timer, Percent, PoundSterling, SprayCan, Wrench, UtensilsCrossed,
  HelpCircle, Tag
} from 'lucide-react';
import { format } from 'date-fns';

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

interface QuoteLeadCardProps {
  lead: QuoteLead;
  adminName?: string;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
}

const isLeadLive = (lead: QuoteLead): boolean => {
  if (lead.status !== 'live') return false;
  if (!lead.last_heartbeat) return false;
  const heartbeatTime = new Date(lead.last_heartbeat).getTime();
  const now = Date.now();
  const twoMinutes = 2 * 60 * 1000;
  return (now - heartbeatTime) <= twoMinutes;
};

const getStepNumber = (step: string | null): number => {
  const steps: Record<string, number> = {
    'property': 1,
    'extras': 2,
    'schedule': 3,
    'datetime': 3,
    'contact': 4,
    'quote': 5,
    'quote_viewed': 5,
    'payment': 6,
    'booking_attempted': 7,
    'booking_completed': 8,
    'completed': 8,
  };
  return steps[step || ''] || 0;
};

const QuoteLeadCard: React.FC<QuoteLeadCardProps> = ({ lead, adminName, isSelected, onSelect }) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), 'dd MMM, HH:mm');
    } catch {
      return dateStr;
    }
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return null;
    }
  };

  const isLive = isLeadLive(lead);
  const stepNumber = getStepNumber(lead.furthest_step);
  const additionalRooms = lead.additional_rooms as Record<string, number> | null;
  
  const hasPropertyInfo = lead.postcode || lead.bedrooms || lead.bathrooms || lead.property_type || lead.kitchen;
  const hasExtras = lead.oven_cleaning || (lead.ironing_hours && lead.ironing_hours > 0) || lead.first_deep_clean || 
    (lead.cleaning_products && lead.cleaning_products.length > 0) || lead.equipment_arrangement;
  const hasSchedule = lead.selected_date || lead.selected_time || lead.frequency || lead.is_flexible;
  const hasContact = lead.first_name || lead.email || lead.phone;
  const hasQuote = lead.calculated_quote;
  const hasPricing = lead.weekly_cost || lead.weekly_hours || lead.discount_amount || lead.short_notice_charge || lead.recommended_hours;

  // Build extras list
  const extrasList: string[] = [];
  if (lead.oven_cleaning) extrasList.push(`Oven${lead.oven_size ? ` (${lead.oven_size})` : ''}`);
  if (lead.ironing_hours && lead.ironing_hours > 0) extrasList.push(`Ironing ${lead.ironing_hours}h`);
  if (lead.first_deep_clean) extrasList.push('First Deep Clean');

  // Build property details string
  const propertyDetails: string[] = [];
  if (lead.bedrooms) propertyDetails.push(`${lead.bedrooms} bed`);
  if (lead.bathrooms) propertyDetails.push(`${lead.bathrooms} bath`);
  if (lead.toilets && lead.toilets > 0) propertyDetails.push(`${lead.toilets} WC`);
  if (lead.reception_rooms && lead.reception_rooms > 0) propertyDetails.push(`${lead.reception_rooms} living`);

  // Additional rooms
  const additionalRoomsList: string[] = [];
  if (additionalRooms) {
    Object.entries(additionalRooms).forEach(([room, count]) => {
      if (count > 0) additionalRoomsList.push(`${count}x ${room}`);
    });
  }
  
  // Cleaning products
  const cleaningProductsList = lead.cleaning_products || [];

  const getStatusStyles = () => {
    if (lead.status === 'completed') return 'border-l-green-500 bg-green-50/30';
    if (isLive) return 'border-l-blue-500 bg-blue-50/30';
    if (lead.status === 'left') return 'border-l-gray-400 bg-gray-50/30';
    return 'border-l-amber-500 bg-amber-50/20';
  };

  return (
    <Card className={`border-l-4 ${getStatusStyles()} overflow-hidden transition-all hover:shadow-md`}>
      <div className="p-4 space-y-3">
        {/* Row 1: Header - Status, Time, Service, Quote */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-gray-300"
            />
            
            {/* Status Badge */}
            {lead.status === 'completed' ? (
              <Badge className="bg-green-100 text-green-700 border-0 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </Badge>
            ) : isLive ? (
              <Badge className="bg-blue-100 text-blue-700 border-0 gap-1 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                Live Now
              </Badge>
            ) : lead.status === 'left' ? (
              <Badge className="bg-gray-100 text-gray-600 border-0 gap-1">
                <XCircle className="h-3 w-3" />
                Left
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-700 border-0 gap-1">
                <AlertCircle className="h-3 w-3" />
                Idle
              </Badge>
            )}

            {/* Service Type */}
            {lead.service_type && (
              <Badge variant="outline" className={
                lead.service_type.toLowerCase().includes('airbnb') || lead.service_type.toLowerCase().includes('air bnb')
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-sky-50 text-sky-700 border-sky-200'
              }>
                {lead.service_type.toLowerCase().includes('airbnb') || lead.service_type.toLowerCase().includes('air bnb') 
                  ? <Building2 className="h-3 w-3 mr-1" />
                  : <Home className="h-3 w-3 mr-1" />
                }
                {lead.service_type}
              </Badge>
            )}

            {/* Quote Email Sent */}
            {lead.quote_email_sent && (
              <Badge className="bg-purple-100 text-purple-700 border-0 gap-1">
                <Mail className="h-3 w-3" />
                Email Sent
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Quote Amount */}
            {hasQuote && (
              <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">
                <Sparkles className="h-4 w-4" />
                £{lead.calculated_quote?.toFixed(2)}
              </div>
            )}
            
            {/* Time */}
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Timer className="h-3 w-3" />
              {formatTimeAgo(lead.updated_at || lead.created_at)}
            </span>
          </div>
        </div>

        {/* Row 2: Customer Info */}
        {hasContact && (
          <div className="flex items-center gap-4 flex-wrap text-sm bg-white/60 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5 text-gray-700 font-medium">
              <User className="h-4 w-4 text-gray-400" />
              {lead.first_name || lead.last_name 
                ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
                : <span className="text-gray-400 italic">No name</span>
              }
            </div>
            {lead.email && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <Mail className="h-4 w-4 text-gray-400" />
                {lead.email}
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <Phone className="h-4 w-4 text-gray-400" />
                {lead.phone}
              </div>
            )}
            {lead.is_first_time_customer && (
              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                New Customer
              </Badge>
            )}
          </div>
        )}

        {/* Row 3: Property Details */}
        {hasPropertyInfo && (
          <div className="flex items-center gap-3 flex-wrap text-sm">
            {/* Property Type */}
            {lead.property_type && (
              <Badge className="bg-slate-200 text-slate-700 border-0 gap-1">
                <Home className="h-3 w-3" />
                {lead.property_type}
              </Badge>
            )}
            
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5">
              <MapPin className="h-4 w-4 text-slate-500" />
              <span className="font-medium text-slate-700">{lead.postcode || 'No postcode'}</span>
              {lead.address && (
                <span className="text-slate-500 text-xs truncate max-w-[200px]">{lead.address}</span>
              )}
            </div>
            
            {propertyDetails.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5">
                <Home className="h-4 w-4 text-slate-500" />
                <div className="flex items-center gap-2 text-slate-700">
                  {lead.bedrooms && (
                    <span className="flex items-center gap-1">
                      <BedDouble className="h-3.5 w-3.5" />
                      {lead.bedrooms}
                    </span>
                  )}
                  {lead.bathrooms && (
                    <span className="flex items-center gap-1">
                      <Bath className="h-3.5 w-3.5" />
                      {lead.bathrooms}
                    </span>
                  )}
                  {lead.reception_rooms && lead.reception_rooms > 0 && (
                    <span className="flex items-center gap-1">
                      <Sofa className="h-3.5 w-3.5" />
                      {lead.reception_rooms}
                    </span>
                  )}
                  {lead.toilets && lead.toilets > 0 && (
                    <span className="flex items-center gap-1">
                      <DoorOpen className="h-3.5 w-3.5" />
                      {lead.toilets}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Kitchen */}
            {lead.kitchen && (
              <Badge variant="outline" className="text-xs bg-white gap-1">
                <UtensilsCrossed className="h-3 w-3" />
                Kitchen: {lead.kitchen}
              </Badge>
            )}

            {additionalRoomsList.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {additionalRoomsList.map((room, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-white">
                    {room}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Row 4: Extras */}
        {hasExtras && (
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="text-gray-500 text-xs font-medium">EXTRAS:</span>
            {lead.oven_cleaning && (
              <Badge className="bg-orange-100 text-orange-700 border-0 gap-1">
                <CookingPot className="h-3 w-3" />
                Oven {lead.oven_size && `(${lead.oven_size})`}
              </Badge>
            )}
            {lead.ironing_hours && lead.ironing_hours > 0 && (
              <Badge className="bg-indigo-100 text-indigo-700 border-0 gap-1">
                <Shirt className="h-3 w-3" />
                Ironing {lead.ironing_hours}h
              </Badge>
            )}
            {lead.first_deep_clean && (
              <Badge className="bg-teal-100 text-teal-700 border-0 gap-1">
                <Sparkles className="h-3 w-3" />
                First Deep Clean
              </Badge>
            )}
            {/* Cleaning Products */}
            {cleaningProductsList.length > 0 && cleaningProductsList.map((product, i) => (
              <Badge key={i} className="bg-lime-100 text-lime-700 border-0 gap-1">
                <SprayCan className="h-3 w-3" />
                {product}
              </Badge>
            ))}
            {/* Equipment Arrangement */}
            {lead.equipment_arrangement && (
              <Badge className="bg-amber-100 text-amber-700 border-0 gap-1">
                <Wrench className="h-3 w-3" />
                {lead.equipment_arrangement}
              </Badge>
            )}
          </div>
        )}

        {/* Row 5: Schedule */}
        {hasSchedule && (
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="text-gray-500 text-xs font-medium">SCHEDULE:</span>
            {lead.frequency && (
              <Badge className="bg-violet-100 text-violet-700 border-0 gap-1">
                <Zap className="h-3 w-3" />
                {lead.frequency}
              </Badge>
            )}
            {lead.selected_date && (
              <Badge className="bg-blue-100 text-blue-700 border-0 gap-1">
                <Calendar className="h-3 w-3" />
                {lead.selected_date}
              </Badge>
            )}
            {/* Show time or TBC if flexible */}
            {lead.selected_time ? (
              <Badge className="bg-cyan-100 text-cyan-700 border-0 gap-1">
                <Clock className="h-3 w-3" />
                {lead.selected_time}
              </Badge>
            ) : lead.is_flexible ? (
              <Badge className="bg-gray-100 text-gray-600 border-0 gap-1">
                <HelpCircle className="h-3 w-3" />
                Time: TBC (Flexible)
              </Badge>
            ) : null}
            {lead.is_flexible && lead.selected_time && (
              <Badge variant="outline" className="text-xs">Flexible</Badge>
            )}
          </div>
        )}

        {/* Row 6: Pricing Details */}
        {hasPricing && (
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="text-gray-500 text-xs font-medium">PRICING:</span>
            {lead.recommended_hours && (
              <Badge className="bg-gray-100 text-gray-700 border-0 gap-1">
                <Clock className="h-3 w-3" />
                {lead.recommended_hours}h recommended
              </Badge>
            )}
            {lead.weekly_hours && (
              <Badge className="bg-sky-100 text-sky-700 border-0 gap-1">
                <Clock className="h-3 w-3" />
                {lead.weekly_hours}h/week
              </Badge>
            )}
            {lead.weekly_cost && (
              <Badge className="bg-emerald-100 text-emerald-700 border-0 gap-1">
                <PoundSterling className="h-3 w-3" />
                £{lead.weekly_cost}/week
              </Badge>
            )}
            {lead.discount_amount && lead.discount_amount > 0 && (
              <Badge className="bg-pink-100 text-pink-700 border-0 gap-1">
                <Percent className="h-3 w-3" />
                -£{lead.discount_amount} discount
              </Badge>
            )}
            {lead.short_notice_charge && lead.short_notice_charge > 0 && (
              <Badge className="bg-red-100 text-red-700 border-0 gap-1">
                <Tag className="h-3 w-3" />
                +£{lead.short_notice_charge} short notice
              </Badge>
            )}
          </div>
        )}

        {/* Row 7: Cleaning Type & Access */}
        <div className="flex items-center gap-2 flex-wrap text-sm">
          {lead.cleaning_type && (
            <Badge variant="outline" className="text-xs">
              {lead.cleaning_type}
            </Badge>
          )}
          {lead.property_access && (
            <Badge variant="outline" className="text-xs">
              Access: {lead.property_access}
            </Badge>
          )}
          {lead.access_notes && (
            <span className="text-xs text-gray-500 italic truncate max-w-[200px]" title={lead.access_notes}>
              Note: {lead.access_notes}
            </span>
          )}
        </div>

        {/* Row 7: Progress & Source */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100 flex-wrap">
          {/* Progress Steps */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
              <div
                key={step}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  step <= stepNumber
                    ? step === stepNumber
                      ? 'bg-primary'
                      : 'bg-primary/50'
                    : 'bg-gray-200'
                }`}
              />
            ))}
            <span className="text-xs text-gray-500 ml-2">
              Step {stepNumber}/8 • {lead.furthest_step || 'Started'}
            </span>
          </div>

          {/* Source Info */}
          <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
            {(lead.source || lead.utm_source) && (
              <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded font-medium">
                <Globe className="h-3 w-3" />
                {lead.source || lead.utm_source}
              </span>
            )}
            {lead.utm_medium && (
              <Badge className={`text-xs border-0 ${
                lead.utm_medium.toLowerCase() === 'sms' ? 'bg-green-100 text-green-700' :
                lead.utm_medium.toLowerCase() === 'email' ? 'bg-blue-100 text-blue-700' :
                lead.utm_medium.toLowerCase() === 'phone' || lead.utm_medium.toLowerCase() === 'call' ? 'bg-amber-100 text-amber-700' :
                lead.utm_medium.toLowerCase() === 'cpc' || lead.utm_medium.toLowerCase() === 'paid' ? 'bg-purple-100 text-purple-700' :
                lead.utm_medium.toLowerCase() === 'organic' ? 'bg-emerald-100 text-emerald-700' :
                lead.utm_medium.toLowerCase() === 'social' ? 'bg-pink-100 text-pink-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {lead.utm_medium.toUpperCase()}
              </Badge>
            )}
            {lead.utm_campaign && (
              <span className="bg-gray-100 px-2 py-0.5 rounded truncate max-w-[150px]" title={lead.utm_campaign}>
                {lead.utm_campaign}
              </span>
            )}
            {adminName && adminName !== '-' && (
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">
                by {adminName}
              </span>
            )}
            <span>{formatDate(lead.created_at)}</span>
          </div>
        </div>

        {/* Converted Booking */}
        {lead.converted_booking_id && (
          <div className="flex items-center gap-2 bg-green-100 text-green-700 rounded-lg px-3 py-2 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Converted to Booking #{lead.converted_booking_id}
            <ArrowRight className="h-4 w-4 ml-auto" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default QuoteLeadCard;