import { useEffect, useRef, useCallback } from 'react';

const SUPABASE_URL = "https://dkomihipebixlegygnoy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb21paGlwZWJpeGxlZ3lnbm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MDEwNTMsImV4cCI6MjA0NjA3NzA1M30.z4hlXMnyyleo4sWyPnFuKFC5-tkQw4lVcDiF8TRWla4";

// Heartbeat interval - send every 30 seconds to indicate browser is still open
const HEARTBEAT_INTERVAL = 30 * 1000;
// Session reuse window - reuse session if created within last 30 minutes
const SESSION_REUSE_WINDOW = 30 * 60 * 1000;

interface QuoteLeadData {
  serviceType?: string;
  cleaningType?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  toilets?: number;
  receptionRooms?: number;
  kitchen?: string;
  additionalRooms?: Record<string, number>;
  ovenCleaning?: boolean;
  ovenSize?: string;
  ironingHours?: number;
  frequency?: string;
  selectedDate?: Date | string;
  selectedTime?: string;
  isFlexible?: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  postcode?: string;
  calculatedQuote?: number;
  weeklyCost?: number;
  discountAmount?: number;
  shortNoticeCharge?: number;
  isFirstTimeCustomer?: boolean;
  recommendedHours?: number;
  status?: 'live' | 'idle' | 'left' | 'completed';
  furthestStep?: string;
}

// Generate or retrieve persistent user ID (stored in localStorage to persist across sessions)
const getUserId = (): string => {
  const storageKey = 'quote_user_id';
  let userId = localStorage.getItem(storageKey);
  
  if (!userId) {
    userId = `qu_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(storageKey, userId);
  }
  
  return userId;
};

// Generate or retrieve session ID with reuse logic
const getSessionId = (): string => {
  const storageKey = 'quote_session_id';
  const timestampKey = 'quote_session_timestamp';
  
  let sessionId = localStorage.getItem(storageKey);
  const sessionTimestamp = localStorage.getItem(timestampKey);
  
  // Check if we should reuse existing session
  if (sessionId && sessionTimestamp) {
    const timestamp = parseInt(sessionTimestamp, 10);
    const age = Date.now() - timestamp;
    
    // Reuse session if it's recent enough
    if (age < SESSION_REUSE_WINDOW) {
      console.log('📊 Reusing existing session:', sessionId);
      return sessionId;
    }
  }
  
  // Create new session
  sessionId = `qs_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  localStorage.setItem(storageKey, sessionId);
  localStorage.setItem(timestampKey, Date.now().toString());
  console.log('📊 Created new session:', sessionId);
  
  return sessionId;
};

// Get UTM parameters from URL
const getUtmParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || null,
    utm_medium: params.get('utm_medium') || null,
    utm_campaign: params.get('utm_campaign') || null,
    utm_term: params.get('utm_term') || null,
    utm_content: params.get('utm_content') || null,
  };
};

export const useQuoteLeadTracking = (serviceType: string) => {
  const userId = useRef(getUserId());
  const sessionId = useRef(getSessionId());
  const lastSaveRef = useRef<number>(0);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const hasRecordCreated = useRef(false);
  const hasTrackedLanding = useRef(false);

  // Track page landing separately (in funnel_events, not quote_leads)
  const trackLanding = useCallback(async () => {
    if (hasTrackedLanding.current) return;
    hasTrackedLanding.current = true;
    
    const utmParams = getUtmParams();
    
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/track-funnel-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          table: 'funnel_events',
          data: {
            user_id: userId.current,
            session_id: sessionId.current,
            event_type: 'quote_page_view',
            event_data: { service_type: serviceType },
            page_url: window.location.href,
            referrer: document.referrer || null,
            user_agent: navigator.userAgent,
            ...utmParams,
          },
        }),
      });
      console.log('📊 Tracked page landing');
    } catch (err) {
      console.error('❌ Error tracking landing:', err);
    }
  }, [serviceType]);

  // Send heartbeat to indicate browser is still open
  const sendHeartbeat = useCallback(async () => {
    if (!hasRecordCreated.current) return;
    
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/track-funnel-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          table: 'quote_leads',
          data: {
            session_id: sessionId.current,
            status: 'live',
            last_heartbeat: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }),
      });
      console.log('💓 Heartbeat sent');
    } catch (err) {
      console.error('❌ Heartbeat error:', err);
    }
  }, []);

  // Initialize tracking on mount
  useEffect(() => {
    // Track page landing (separate from quote_leads)
    trackLanding();
    
    // Store UTM params for later use
    const utmParams = getUtmParams();
    if (Object.values(utmParams).some(v => v)) {
      localStorage.setItem('quote_utm_params', JSON.stringify(utmParams));
    }

    // Start heartbeat interval (only if record exists)
    heartbeatInterval.current = setInterval(() => {
      if (hasRecordCreated.current) {
        sendHeartbeat();
      }
    }, HEARTBEAT_INTERVAL);

    // Mark as 'left' when user leaves the page
    const handleBeforeUnload = () => {
      if (!hasRecordCreated.current) return;
      
      const currentStep = localStorage.getItem('quote_furthest_step') || 'started';
      const leadData = {
        user_id: userId.current,
        session_id: sessionId.current,
        service_type: serviceType,
        status: 'left',
        furthest_step: currentStep,
        updated_at: new Date().toISOString(),
      };
      
      navigator.sendBeacon(
        `${SUPABASE_URL}/functions/v1/track-funnel-event`,
        JSON.stringify({
          table: 'quote_leads',
          data: leadData,
        })
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, [serviceType, trackLanding, sendHeartbeat]);

  const saveQuoteLead = useCallback(async (data: QuoteLeadData, force = false) => {
    const now = Date.now();
    
    // Debounce saves to avoid excessive API calls (minimum 2 seconds between saves)
    if (!force && now - lastSaveRef.current < 2000) {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      debounceTimeout.current = setTimeout(() => {
        saveQuoteLead(data, true);
      }, 2000);
      return;
    }
    
    lastSaveRef.current = now;

    try {
      const utmParams = JSON.parse(localStorage.getItem('quote_utm_params') || '{}');
      
      const leadData = {
        user_id: userId.current,
        session_id: sessionId.current,
        service_type: data.serviceType || serviceType,
        cleaning_type: data.cleaningType,
        property_type: data.propertyType,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        toilets: data.toilets,
        reception_rooms: data.receptionRooms,
        kitchen: data.kitchen,
        additional_rooms: data.additionalRooms,
        oven_cleaning: data.ovenCleaning,
        oven_size: data.ovenSize,
        ironing_hours: data.ironingHours,
        frequency: data.frequency,
        selected_date: data.selectedDate instanceof Date 
          ? data.selectedDate.toISOString().split('T')[0] 
          : data.selectedDate,
        selected_time: data.selectedTime,
        is_flexible: data.isFlexible,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        postcode: data.postcode,
        calculated_quote: data.calculatedQuote,
        weekly_cost: data.weeklyCost,
        discount_amount: data.discountAmount,
        short_notice_charge: data.shortNoticeCharge,
        is_first_time_customer: data.isFirstTimeCustomer,
        recommended_hours: data.recommendedHours,
        status: data.status || 'live',
        furthest_step: data.furthestStep,
        page_url: window.location.href,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        last_heartbeat: new Date().toISOString(),
        ...utmParams,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(leadData).filter(([_, v]) => v !== undefined)
      );

      console.log('📊 Saving quote lead:', cleanedData);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/track-funnel-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          table: 'quote_leads',
          data: cleanedData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Error saving quote lead:', error);
      } else {
        hasRecordCreated.current = true;
        console.log('✅ Quote lead saved successfully');
      }
    } catch (err) {
      console.error('❌ Error in saveQuoteLead:', err);
    }
  }, [serviceType]);

  // Only create record when meaningful data is entered
  const trackStep = useCallback((step: string, additionalData?: Partial<QuoteLeadData>) => {
    // Store the furthest step for use in beforeunload
    localStorage.setItem('quote_furthest_step', step);
    
    // Only save if we have meaningful data
    const hasMeaningfulData = additionalData && (
      additionalData.propertyType ||
      additionalData.cleaningType ||
      additionalData.bedrooms ||
      additionalData.postcode ||
      additionalData.email
    );
    
    if (hasMeaningfulData || hasRecordCreated.current) {
      saveQuoteLead({
        status: 'live',
        furthestStep: step,
        ...additionalData,
      });
    }
  }, [saveQuoteLead]);

  const trackQuoteCalculated = useCallback((quote: number, hours?: number, data?: Partial<QuoteLeadData>) => {
    saveQuoteLead({
      calculatedQuote: quote,
      recommendedHours: hours,
      furthestStep: 'quote_viewed',
      ...data,
    });
  }, [saveQuoteLead]);

  const markCompleted = useCallback((data?: Partial<QuoteLeadData>) => {
    saveQuoteLead({
      status: 'completed',
      furthestStep: 'booking_completed',
      ...data,
    }, true);
  }, [saveQuoteLead]);

  // Force create a record (used when resuming from email)
  const initializeFromResume = useCallback((resumeSessionId: string) => {
    sessionId.current = resumeSessionId;
    localStorage.setItem('quote_session_id', resumeSessionId);
    localStorage.setItem('quote_session_timestamp', Date.now().toString());
    hasRecordCreated.current = true;
  }, []);

  // Mark that quote email was sent for this session
  const markQuoteEmailSent = useCallback(async (email: string) => {
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/track-funnel-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          table: 'quote_leads',
          data: {
            session_id: sessionId.current,
            email,
            quote_email_sent: true,
            quote_email_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }),
      });
      hasRecordCreated.current = true;
      console.log('✅ Quote email marked as sent');
    } catch (err) {
      console.error('❌ Error marking quote email sent:', err);
    }
  }, []);

  return {
    saveQuoteLead,
    trackStep,
    trackQuoteCalculated,
    markCompleted,
    initializeFromResume,
    markQuoteEmailSent,
    userId: userId.current,
    sessionId: sessionId.current,
  };
};
