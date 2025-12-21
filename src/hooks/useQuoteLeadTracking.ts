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
  // Admin tracking
  adminId?: string;
  isAdminCreated?: boolean;
  // Conversion tracking
  convertedBookingId?: number;
  // Cleaning products & equipment
  cleaningProducts?: string[];
  equipmentArrangement?: 'oneoff' | 'ongoing' | null;
}

interface TrackingOptions {
  isAdminMode?: boolean;
  adminId?: string;
  adminEmail?: string;
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

// Get UTM parameters from URL (check current URL first, then referrer, then localStorage)
const getUtmParams = () => {
  // First check localStorage for originally captured UTM params (highest priority - these were captured on first landing)
  const storedParams = localStorage.getItem('quote_utm_params');
  if (storedParams) {
    try {
      const parsed = JSON.parse(storedParams);
      if (parsed.utm_source || parsed.utm_medium || parsed.utm_campaign) {
        console.log('📊 Using stored UTM params:', parsed);
        return {
          utm_source: parsed.utm_source || null,
          utm_medium: parsed.utm_medium || null,
          utm_campaign: parsed.utm_campaign || null,
          utm_term: parsed.utm_term || null,
          utm_content: parsed.utm_content || null,
        };
      }
    } catch {
      // Invalid JSON, ignore
    }
  }
  
  // Check current URL
  let params = new URLSearchParams(window.location.search);
  
  if (params.get('utm_source') || params.get('utm_medium') || params.get('utm_campaign')) {
    const utmParams = {
      utm_source: params.get('utm_source') || null,
      utm_medium: params.get('utm_medium') || null,
      utm_campaign: params.get('utm_campaign') || null,
      utm_term: params.get('utm_term') || null,
      utm_content: params.get('utm_content') || null,
    };
    console.log('📊 UTM params from current URL:', utmParams);
    return utmParams;
  }
  
  // If no UTM params in current URL, check the referrer URL
  if (document.referrer) {
    try {
      const referrerUrl = new URL(document.referrer);
      params = new URLSearchParams(referrerUrl.search);
      
      if (params.get('utm_source') || params.get('utm_medium') || params.get('utm_campaign')) {
        const utmParams = {
          utm_source: params.get('utm_source') || null,
          utm_medium: params.get('utm_medium') || null,
          utm_campaign: params.get('utm_campaign') || null,
          utm_term: params.get('utm_term') || null,
          utm_content: params.get('utm_content') || null,
        };
        console.log('📊 UTM params from referrer:', utmParams);
        return utmParams;
      }
    } catch {
      // Invalid referrer URL, ignore
    }
  }
  
  return {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
  };
};

// Extract UTM source from a URL's query params
const getUtmSourceFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('utm_source');
  } catch {
    return null;
  }
};

// Extract source from referrer URL
const getSourceFromReferrer = (referrer: string | null): string | null => {
  if (!referrer) return null;
  
  try {
    const referrerUrl = new URL(referrer);
    const hostname = referrerUrl.hostname.toLowerCase();
    
    // For self-referrals, extract UTM source from the referrer URL params
    if (hostname.includes('sncleaningservices') || 
        hostname.includes('lovable') || 
        hostname.includes('lovableproject')) {
      // Check if there are UTM params in the referrer URL
      const utmSource = referrerUrl.searchParams.get('utm_source');
      if (utmSource) {
        return utmSource.toLowerCase();
      }
      return null;
    }
    
    if (hostname.includes('google')) return 'google';
    if (hostname.includes('facebook') || hostname.includes('fb.com') || hostname.includes('m.facebook')) return 'facebook';
    if (hostname.includes('instagram')) return 'instagram';
    if (hostname.includes('tiktok')) return 'tiktok';
    if (hostname.includes('twitter') || hostname.includes('x.com')) return 'twitter';
    if (hostname.includes('linkedin')) return 'linkedin';
    if (hostname.includes('bing')) return 'bing';
    if (hostname.includes('yahoo')) return 'yahoo';
    if (hostname.includes('pinterest')) return 'pinterest';
    if (hostname.includes('youtube')) return 'youtube';
    if (hostname.includes('nextdoor')) return 'nextdoor';
    
    // Return the cleaned domain as source
    return hostname.replace('www.', '').replace('m.', '');
  } catch {
    return null;
  }
};

// Determine source based on UTM params or referrer
const determineSource = (): string => {
  // First check current URL params
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source');
  
  if (utmSource) {
    return utmSource;
  }
  
  // Check referrer URL for UTM params (e.g., when navigating from services page)
  if (document.referrer) {
    const referrerUtmSource = getUtmSourceFromUrl(document.referrer);
    if (referrerUtmSource) {
      return referrerUtmSource;
    }
  }
  
  // Try to determine from referrer hostname
  const referrerSource = getSourceFromReferrer(document.referrer);
  if (referrerSource) {
    return referrerSource;
  }
  
  return 'direct';
};

export const useQuoteLeadTracking = (serviceType: string, options?: TrackingOptions) => {
  const { isAdminMode = false, adminId, adminEmail } = options || {};
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
    // Check if we have fresh UTM params in the current URL (direct link to booking form)
    const currentParams = new URLSearchParams(window.location.search);
    const hasCurrentUtm = currentParams.get('utm_source') || currentParams.get('utm_medium') || currentParams.get('utm_campaign');
    
    if (hasCurrentUtm) {
      // Direct link to booking form with UTM params - store them
      const utmParams = {
        utm_source: currentParams.get('utm_source') || null,
        utm_medium: currentParams.get('utm_medium') || null,
        utm_campaign: currentParams.get('utm_campaign') || null,
        utm_term: currentParams.get('utm_term') || null,
        utm_content: currentParams.get('utm_content') || null,
      };
      localStorage.setItem('quote_utm_params', JSON.stringify(utmParams));
      localStorage.setItem('quote_source', utmParams.utm_source?.toLowerCase() || 'website');
      console.log('📊 Direct booking link - captured UTM params:', utmParams);
    }
    
    // Log what we have stored for debugging
    const storedUtm = localStorage.getItem('quote_utm_params');
    const storedSource = localStorage.getItem('quote_source');
    console.log('📊 useQuoteLeadTracking init - Stored UTM:', storedUtm);
    console.log('📊 useQuoteLeadTracking init - Stored source:', storedSource);
    
    // Track page landing (separate from quote_leads)
    trackLanding();

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
      const storedUtmParams = localStorage.getItem('quote_utm_params');
      const utmParams = storedUtmParams ? JSON.parse(storedUtmParams) : {};
      
      // Use "admin" as source when in admin mode, otherwise use stored source or fallback to 'direct'
      const source = isAdminMode ? 'admin' : (localStorage.getItem('quote_source') || 'direct');
      
      console.log('📊 saveQuoteLead - Using source:', source, 'UTM:', utmParams);
      
      const leadData: Record<string, unknown> = {
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
        cleaning_products: data.cleaningProducts,
        equipment_arrangement: data.equipmentArrangement,
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
        source: source,
        page_url: window.location.href,
        // Use stored original landing URL if available (this is the URL with all tracking params from the services page)
        referrer: localStorage.getItem('quote_original_landing_url') || document.referrer || null,
        user_agent: navigator.userAgent,
        last_heartbeat: new Date().toISOString(),
        ...utmParams,
        updated_at: new Date().toISOString(),
        ...(data.convertedBookingId && { converted_booking_id: data.convertedBookingId }),
      };

      // Add admin info when in admin mode or when adminId is provided in data
      const effectiveAdminId = data.adminId || adminId;
      if ((isAdminMode || data.isAdminCreated) && effectiveAdminId) {
        leadData.created_by_admin_id = effectiveAdminId;
        leadData.source = 'admin'; // Override source for admin-created leads
      }

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

  // Track when user clicks "Complete Booking" button (before actual submission)
  // This helps identify failed booking attempts
  const trackBookingAttempt = useCallback((data?: Partial<QuoteLeadData>) => {
    console.log('📊 Tracking booking attempt (Complete Booking clicked)');
    saveQuoteLead({
      status: 'live',
      furthestStep: 'booking_attempted',
      ...data,
    });
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
    trackBookingAttempt,
    initializeFromResume,
    markQuoteEmailSent,
    userId: userId.current,
    sessionId: sessionId.current,
  };
};
