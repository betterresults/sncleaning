import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const ShortLinkResolver = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolveShortLink = async () => {
      if (!shortCode) {
        setError('Invalid link');
        return;
      }

      try {
        // Look up the quote_lead by short_code
        const { data, error: fetchError } = await supabase
          .from('quote_leads')
          .select('*')
          .eq('short_code', shortCode)
          .single();

        if (fetchError || !data) {
          console.error('Short link lookup error:', fetchError);
          setError('This link has expired or is invalid');
          return;
        }

        // Build the redirect URL with all the saved data
        const params = new URLSearchParams();

        // Property details
        if (data.property_type) params.set('propertyType', data.property_type);
        // Use !== null check for bedrooms/bathrooms since 0 (studio) is a valid value
        if (data.bedrooms !== null && data.bedrooms !== undefined) {
          // Convert 0 back to 'studio' for the form
          params.set('bedrooms', data.bedrooms === 0 ? 'studio' : data.bedrooms.toString());
        }
        if (data.bathrooms !== null && data.bathrooms !== undefined) {
          params.set('bathrooms', data.bathrooms.toString());
        }
        if (data.frequency) params.set('frequency', data.frequency);
        if (data.postcode) params.set('postcode', data.postcode);
        
        // Oven cleaning
        if (data.oven_cleaning) params.set('oven', '1');
        if (data.oven_size) params.set('ovenType', data.oven_size);
        
        // Date/time
        if (data.selected_date) params.set('date', data.selected_date);
        // Convert SQL time format (HH:MM:SS) to display format (9:00 AM)
        // Default to 10:00 AM if no time set and not flexible - ensures quote links work
        const timeToUse = data.selected_time || (!data.is_flexible ? '10:00:00' : null);
        if (timeToUse) {
          const timeParts = timeToUse.match(/^(\d{1,2}):(\d{2})/);
          if (timeParts) {
            let hours = parseInt(timeParts[1], 10);
            const period = hours >= 12 ? 'PM' : 'AM';
            if (hours > 12) hours -= 12;
            if (hours === 0) hours = 12;
            params.set('time', `${hours}:00 ${period}`);
          } else {
            params.set('time', timeToUse);
          }
        }
        // Pass flexibility setting - if is_flexible is true, time is flexible
        if (data.is_flexible) {
          params.set('flexibility', 'flexible-time');
        }
        
        // Contact info
        if (data.email) params.set('email', data.email);
        if (data.first_name) params.set('firstName', data.first_name);
        if (data.last_name) params.set('lastName', data.last_name);
        if (data.phone) params.set('phone', data.phone);
        
        // Pricing (critical to preserve exact quote)
        if (data.calculated_quote) params.set('quotedCost', data.calculated_quote.toString());
        if (data.recommended_hours) params.set('quotedHours', data.recommended_hours.toString());
        if (data.short_notice_charge) params.set('shortNotice', data.short_notice_charge.toString());
        if (data.is_first_time_customer !== null) params.set('firstTime', data.is_first_time_customer ? '1' : '0');
        
        // First deep clean specific fields
        if (data.first_deep_clean) params.set('firstDeepClean', '1');
        if (data.weekly_hours) params.set('weeklyHours', data.weekly_hours.toString());
        if (data.weekly_cost) params.set('weeklyCost', data.weekly_cost.toString());
        
        // Session tracking
        if (data.session_id) params.set('ref', data.session_id);
        
        // Agent attribution - CRITICAL for sales agent tracking
        if (data.agent_user_id) params.set('agentUserId', data.agent_user_id);
        
        // Address - pass the combined address which will be parsed by the booking form
        if (data.address) params.set('address', data.address);
        
        // Property access
        if (data.property_access) params.set('propertyAccess', data.property_access);
        if (data.access_notes) params.set('accessNotes', data.access_notes);

        // Determine the route based on service type
        const serviceType = data.service_type || 'Domestic';
        console.log('[ShortLinkResolver] Raw service_type from DB:', JSON.stringify(data.service_type));
        console.log('[ShortLinkResolver] Using serviceType:', serviceType);
        let route = '/domestic-cleaning';
        
        // Check for Carpet Cleaning FIRST (before Domestic) to prevent false matching
        if (serviceType === 'Carpet Cleaning' || serviceType === 'carpet_cleaning' || serviceType.toLowerCase().includes('carpet')) {
          route = '/carpet-cleaning';
          console.log('[ShortLinkResolver] Matched Carpet Cleaning route');
          console.log('[ShortLinkResolver] data.carpet_items:', data.carpet_items);
          console.log('[ShortLinkResolver] data.upholstery_items:', data.upholstery_items);
          console.log('[ShortLinkResolver] data.mattress_items:', data.mattress_items);
          
          // For carpet cleaning, pass items as JSON in URL params
          // Use type assertion since these columns were added after types were generated
          const carpetItems = (data as any).carpet_items;
          const upholsteryItems = (data as any).upholstery_items;
          const mattressItems = (data as any).mattress_items;
          
          if (carpetItems && Array.isArray(carpetItems) && carpetItems.length > 0) {
            params.set('carpetItems', JSON.stringify(carpetItems));
            console.log('[ShortLinkResolver] Set carpetItems param:', JSON.stringify(carpetItems));
          }
          if (upholsteryItems && Array.isArray(upholsteryItems) && upholsteryItems.length > 0) {
            params.set('upholsteryItems', JSON.stringify(upholsteryItems));
            console.log('[ShortLinkResolver] Set upholsteryItems param:', JSON.stringify(upholsteryItems));
          }
          if (mattressItems && Array.isArray(mattressItems) && mattressItems.length > 0) {
            params.set('mattressItems', JSON.stringify(mattressItems));
            console.log('[ShortLinkResolver] Set mattressItems param:', JSON.stringify(mattressItems));
          }
        } else if (serviceType === 'Airbnb' || serviceType === 'airbnb' || serviceType.toLowerCase().includes('airbnb')) {
          route = '/airbnb-cleaning';
          console.log('[ShortLinkResolver] Matched Airbnb route');
        } else {
          route = '/domestic-cleaning';
          console.log('[ShortLinkResolver] Using Domestic route (default)');
        }
        
        console.log('[ShortLinkResolver] Final URL params:', params.toString());

        // Update status to show they clicked the link
        await supabase
          .from('quote_leads')
          .update({ 
            status: 'link_clicked',
            updated_at: new Date().toISOString()
          })
          .eq('short_code', shortCode);

        // Navigate to the form with all params
        navigate(`${route}?${params.toString()}`, { replace: true });
        
      } catch (err) {
        console.error('Error resolving short link:', err);
        setError('Something went wrong. Please try again.');
      }
    };

    resolveShortLink();
  }, [shortCode, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Link Error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading your booking...</p>
      </div>
    </div>
  );
};

export default ShortLinkResolver;
