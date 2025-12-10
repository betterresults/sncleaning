import { useEffect, useRef, useCallback } from 'react';

const SUPABASE_URL = "https://dkomihipebixlegygnoy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb21paGlwZWJpeGxlZ3lnbm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MDEwNTMsImV4cCI6MjA0NjA3NzA1M30.z4hlXMnyyleo4sWyPnFuKFC5-tkQw4lVcDiF8TRWla4";

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
  recommendedHours?: number;
  status?: 'viewing' | 'completed' | 'abandoned';
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

// Generate session ID for current browsing session  
const getSessionId = (): string => {
  const storageKey = 'quote_session_id';
  let sessionId = sessionStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = `qs_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem(storageKey, sessionId);
  }
  
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
  const hasInitialized = useRef(false);

  // Initialize tracking on mount
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      const utmParams = getUtmParams();
      
      // Create initial record
      saveQuoteLead({
        serviceType,
        status: 'viewing',
        furthestStep: 'started',
      }, true);
      
      // Store UTM params separately if they exist
      if (Object.values(utmParams).some(v => v)) {
        sessionStorage.setItem('quote_utm_params', JSON.stringify(utmParams));
      }
    }
  }, [serviceType]);

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
      const utmParams = JSON.parse(sessionStorage.getItem('quote_utm_params') || '{}');
      
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
        recommended_hours: data.recommendedHours,
        status: data.status || 'viewing',
        furthest_step: data.furthestStep,
        page_url: window.location.href,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        ...utmParams,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(leadData).filter(([_, v]) => v !== undefined)
      );

      console.log('📊 Saving quote lead:', cleanedData);

      // Call edge function to bypass RLS
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
        console.log('✅ Quote lead saved successfully');
      }
    } catch (err) {
      console.error('❌ Error in saveQuoteLead:', err);
    }
  }, [serviceType]);

  const trackStep = useCallback((step: string, additionalData?: Partial<QuoteLeadData>) => {
    saveQuoteLead({
      furthestStep: step,
      ...additionalData,
    });
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

  return {
    saveQuoteLead,
    trackStep,
    trackQuoteCalculated,
    markCompleted,
    userId: userId.current,
    sessionId: sessionId.current,
  };
};
