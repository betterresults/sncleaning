import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QuoteLeadData {
  // Service details
  serviceType?: string;
  cleaningType?: string;
  
  // Property details
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  toilets?: number;
  receptionRooms?: number;
  kitchen?: string;
  additionalRooms?: Record<string, number>;
  
  // Service options
  ovenCleaning?: boolean;
  ovenSize?: string;
  ironingHours?: number;
  frequency?: string;
  
  // Schedule
  selectedDate?: Date | string;
  selectedTime?: string;
  isFlexible?: boolean;
  
  // Contact info
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  postcode?: string;
  
  // Quote details
  calculatedQuote?: number;
  recommendedHours?: number;
  
  // Status
  status?: 'viewing' | 'completed' | 'abandoned';
  furthestStep?: string;
}

// Generate or retrieve session ID
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
      // Schedule a delayed save
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
      ) as {
        session_id: string;
        [key: string]: unknown;
      };

      const { error } = await supabase
        .from('quote_leads')
        .upsert(cleanedData as any, { 
          onConflict: 'session_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error saving quote lead:', error);
      }
    } catch (err) {
      console.error('Error in saveQuoteLead:', err);
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
    sessionId: sessionId.current,
  };
};
