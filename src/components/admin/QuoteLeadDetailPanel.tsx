import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  User, Mail, Phone, MapPin, Home, Bath, BedDouble, 
  Calendar, Clock, Sparkles, Building2, Utensils,
  Globe, MousePointerClick, Link2, Timer, CheckCircle2,
  XCircle, AlertCircle, CookingPot, Shirt, DoorOpen,
  Users, Sofa, Layers, Key, Wrench, Package
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

interface QuoteLeadDetailPanelProps {
  lead: QuoteLead;
  adminName?: string;
}

const InfoItem = ({ 
  icon: Icon, 
  label, 
  value, 
  highlight = false,
  valueClassName = ''
}: { 
  icon: React.ElementType; 
  label: string; 
  value: React.ReactNode;
  highlight?: boolean;
  valueClassName?: string;
}) => {
  if (!value && value !== 0) return null;
  
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${highlight ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
      <div className={`p-2 rounded-lg ${highlight ? 'bg-green-100' : 'bg-gray-100'}`}>
        <Icon className={`h-4 w-4 ${highlight ? 'text-green-600' : 'text-gray-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className={`text-sm font-medium mt-0.5 ${valueClassName || 'text-gray-900'}`}>{value}</p>
      </div>
    </div>
  );
};

const SectionHeader = ({ title, icon: Icon }: { title: string; icon: React.ElementType }) => (
  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
    <Icon className="h-4 w-4 text-primary" />
    <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
  </div>
);

const QuoteLeadDetailPanel: React.FC<QuoteLeadDetailPanelProps> = ({ lead, adminName }) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), 'dd MMM yyyy, HH:mm');
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

  const getStepProgress = (step: string | null): { percent: number; label: string; color: string } => {
    const steps: Record<string, { percent: number; label: string; color: string }> = {
      'property': { percent: 20, label: 'Property Details', color: 'bg-blue-500' },
      'extras': { percent: 40, label: 'Extras Selected', color: 'bg-yellow-500' },
      'schedule': { percent: 60, label: 'Schedule Chosen', color: 'bg-orange-500' },
      'datetime': { percent: 60, label: 'Date/Time Selected', color: 'bg-orange-500' },
      'contact': { percent: 75, label: 'Contact Info', color: 'bg-purple-500' },
      'quote': { percent: 80, label: 'Quote Viewed', color: 'bg-teal-500' },
      'quote_viewed': { percent: 80, label: 'Quote Viewed', color: 'bg-teal-500' },
      'payment': { percent: 90, label: 'Payment Step', color: 'bg-green-500' },
      'booking_attempted': { percent: 95, label: 'Booking Attempted', color: 'bg-green-600' },
      'booking_completed': { percent: 100, label: 'Booking Completed', color: 'bg-green-700' },
      'completed': { percent: 100, label: 'Completed', color: 'bg-green-700' },
    };
    return steps[step || ''] || { percent: 10, label: step || 'Started', color: 'bg-gray-400' };
  };

  const progress = getStepProgress(lead.furthest_step);

  const additionalRooms = lead.additional_rooms as Record<string, number> | null;

  return (
    <div className="bg-gradient-to-br from-gray-50/80 to-white p-4 sm:p-6 border-t border-gray-100">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Customer Journey Progress</span>
          <span className="text-sm font-semibold text-gray-900">{progress.percent}%</span>
        </div>
        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${progress.color} transition-all duration-500 rounded-full`}
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1.5">Furthest step: <span className="font-medium">{progress.label}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Customer Details */}
        <div className="space-y-1">
          <SectionHeader title="Customer Details" icon={User} />
          <InfoItem 
            icon={User} 
            label="Name" 
            value={lead.first_name || lead.last_name ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim() : null} 
          />
          <InfoItem icon={Mail} label="Email" value={lead.email} />
          <InfoItem icon={Phone} label="Phone" value={lead.phone} />
          <InfoItem 
            icon={Sparkles} 
            label="Customer Type" 
            value={lead.is_first_time_customer ? 'First Time Customer' : lead.is_first_time_customer === false ? 'Returning Customer' : null}
            highlight={lead.is_first_time_customer || false}
          />
        </div>

        {/* Property Details */}
        <div className="space-y-1">
          <SectionHeader title="Property Details" icon={Home} />
          <InfoItem icon={MapPin} label="Postcode" value={lead.postcode} />
          <InfoItem icon={Home} label="Address" value={lead.address} />
          <InfoItem icon={Building2} label="Property Type" value={lead.property_type} />
          <InfoItem icon={BedDouble} label="Bedrooms" value={lead.bedrooms} />
          <InfoItem icon={Bath} label="Bathrooms" value={lead.bathrooms} />
          {lead.toilets && <InfoItem icon={DoorOpen} label="Toilets" value={lead.toilets} />}
          {lead.reception_rooms && <InfoItem icon={Sofa} label="Reception Rooms" value={lead.reception_rooms} />}
          {lead.kitchen && <InfoItem icon={Utensils} label="Kitchen" value={lead.kitchen} />}
          {additionalRooms && Object.keys(additionalRooms).length > 0 && (
            <InfoItem 
              icon={Layers} 
              label="Additional Rooms" 
              value={
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(additionalRooms).map(([room, count]) => (
                    <Badge key={room} variant="outline" className="text-xs">
                      {room}: {count}
                    </Badge>
                  ))}
                </div>
              } 
            />
          )}
        </div>

        {/* Service & Quote */}
        <div className="space-y-1">
          <SectionHeader title="Service & Quote" icon={Package} />
          <InfoItem 
            icon={Layers} 
            label="Service Type" 
            value={
              lead.service_type && (
                <Badge className={lead.service_type === 'Air BnB' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'}>
                  {lead.service_type}
                </Badge>
              )
            } 
          />
          <InfoItem icon={Wrench} label="Cleaning Type" value={lead.cleaning_type} />
          <InfoItem icon={Calendar} label="Frequency" value={lead.frequency} />
          <InfoItem 
            icon={Sparkles} 
            label="Quote" 
            value={lead.calculated_quote ? `£${lead.calculated_quote.toFixed(2)}` : null}
            highlight={!!lead.calculated_quote}
            valueClassName="text-green-600 text-lg"
          />
          <InfoItem icon={Clock} label="Recommended Hours" value={lead.recommended_hours ? `${lead.recommended_hours}h` : null} />
          {lead.weekly_cost && <InfoItem icon={Calendar} label="Weekly Cost" value={`£${lead.weekly_cost.toFixed(2)}`} />}
          {lead.weekly_hours && <InfoItem icon={Clock} label="Weekly Hours" value={`${lead.weekly_hours}h`} />}
          {lead.discount_amount && lead.discount_amount > 0 && (
            <InfoItem icon={Sparkles} label="Discount" value={`-£${lead.discount_amount.toFixed(2)}`} valueClassName="text-red-500" />
          )}
          {lead.short_notice_charge && lead.short_notice_charge > 0 && (
            <InfoItem icon={AlertCircle} label="Short Notice" value={`+£${lead.short_notice_charge.toFixed(2)}`} valueClassName="text-orange-500" />
          )}
          {lead.first_deep_clean && (
            <InfoItem icon={Sparkles} label="First Deep Clean" value="Yes" highlight />
          )}
        </div>

        {/* Extras */}
        <div className="space-y-1">
          <SectionHeader title="Extras & Access" icon={CookingPot} />
          {lead.oven_cleaning && (
            <InfoItem icon={CookingPot} label="Oven Cleaning" value={lead.oven_size || 'Yes'} />
          )}
          {lead.ironing_hours && lead.ironing_hours > 0 && (
            <InfoItem icon={Shirt} label="Ironing" value={`${lead.ironing_hours} hours`} />
          )}
          <InfoItem icon={Key} label="Property Access" value={lead.property_access} />
          {lead.access_notes && <InfoItem icon={DoorOpen} label="Access Notes" value={lead.access_notes} />}
          {lead.cleaning_products && lead.cleaning_products.length > 0 && (
            <InfoItem 
              icon={Package} 
              label="Cleaning Products" 
              value={
                <div className="flex flex-wrap gap-1 mt-1">
                  {lead.cleaning_products.map((product, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{product}</Badge>
                  ))}
                </div>
              } 
            />
          )}
          {lead.equipment_arrangement && (
            <InfoItem icon={Wrench} label="Equipment" value={lead.equipment_arrangement} />
          )}
        </div>
      </div>

      {/* Schedule & Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 pt-6 border-t border-gray-100">
        {/* Schedule */}
        <div className="space-y-1">
          <SectionHeader title="Schedule" icon={Calendar} />
          <InfoItem icon={Calendar} label="Selected Date" value={lead.selected_date} />
          <InfoItem icon={Clock} label="Selected Time" value={lead.selected_time} />
          {lead.is_flexible && <InfoItem icon={Clock} label="Flexible" value="Yes, flexible on time" />}
        </div>

        {/* Status & Tracking */}
        <div className="space-y-1">
          <SectionHeader title="Status & Tracking" icon={CheckCircle2} />
          <InfoItem 
            icon={lead.status === 'completed' ? CheckCircle2 : lead.status === 'left' ? XCircle : AlertCircle} 
            label="Status" 
            value={
              <Badge className={
                lead.status === 'completed' ? 'bg-green-100 text-green-700' :
                lead.status === 'left' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
              }>
                {lead.status}
              </Badge>
            } 
          />
          {lead.quote_email_sent && (
            <InfoItem 
              icon={Mail} 
              label="Quote Email" 
              value={`Sent ${formatDate(lead.quote_email_sent_at)}`}
              highlight
            />
          )}
          {lead.converted_booking_id && (
            <InfoItem 
              icon={CheckCircle2} 
              label="Converted Booking" 
              value={`#${lead.converted_booking_id}`}
              highlight
            />
          )}
          <InfoItem icon={Timer} label="Last Activity" value={formatTimeAgo(lead.last_heartbeat)} />
          {adminName && <InfoItem icon={Users} label="Created By" value={adminName} />}
        </div>

        {/* Source & UTM */}
        <div className="space-y-1">
          <SectionHeader title="Traffic Source" icon={Globe} />
          <InfoItem icon={Globe} label="Source" value={lead.source || lead.utm_source} />
          <InfoItem icon={MousePointerClick} label="Medium" value={lead.utm_medium} />
          <InfoItem icon={Link2} label="Campaign" value={lead.utm_campaign} />
          {lead.utm_term && <InfoItem icon={Link2} label="Term" value={lead.utm_term} />}
          {lead.utm_content && <InfoItem icon={Link2} label="Content" value={lead.utm_content} />}
          {lead.referrer && (
            <InfoItem 
              icon={Link2} 
              label="Referrer" 
              value={
                <span className="truncate block max-w-[200px]" title={lead.referrer}>
                  {lead.referrer}
                </span>
              } 
            />
          )}
        </div>

        {/* Timestamps */}
        <div className="space-y-1">
          <SectionHeader title="Timeline" icon={Clock} />
          <InfoItem icon={Clock} label="Created" value={formatDate(lead.created_at)} />
          <InfoItem icon={Clock} label="Updated" value={formatDate(lead.updated_at)} />
          {lead.confirmation_sent_at && (
            <InfoItem icon={Mail} label="Confirmation Sent" value={formatDate(lead.confirmation_sent_at)} />
          )}
          {lead.confirmed_at && (
            <InfoItem icon={CheckCircle2} label="Confirmed" value={formatDate(lead.confirmed_at)} highlight />
          )}
          {lead.expires_at && (
            <InfoItem icon={AlertCircle} label="Expires" value={formatDate(lead.expires_at)} />
          )}
          {lead.short_code && (
            <InfoItem icon={Link2} label="Short Code" value={lead.short_code} />
          )}
        </div>
      </div>

      {/* Session Info */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
          <span>Session: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{lead.session_id}</code></span>
          {lead.user_id && <span>User: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{lead.user_id}</code></span>}
          {lead.page_url && (
            <span className="truncate max-w-[300px]">
              Page: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{lead.page_url}</code>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuoteLeadDetailPanel;
