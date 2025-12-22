import { useEffect, useRef, useCallback } from 'react';
import { CarpetCleaningData, CarpetCleaningItem } from '../components/booking/CarpetCleaningForm';

const SUPABASE_URL = "https://dkomihipebixlegygnoy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb21paGlwZWJpeGxlZ3lnbm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MDEwNTMsImV4cCI6MjA0NjA3NzA1M30.z4hlXMnyyleo4sWyPnFuKFC5-tkQw4lVcDiF8TRWla4";

const HEARTBEAT_INTERVAL = 30 * 1000;
const SESSION_REUSE_WINDOW = 7 * 24 * 60 * 60 * 1000;

// Generate or retrieve persistent user ID
const getUserId = (): string => {
  const storageKey = 'carpet_quote_user_id';
  let userId = localStorage.getItem(storageKey);
  
  if (!userId) {
    userId = `cqu_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(storageKey, userId);
  }
  
  return userId;
};

// Generate or retrieve session ID
const getSessionId = (): string => {
  const storageKey = 'carpet_quote_session_id';
  const timestampKey = 'carpet_quote_session_timestamp';
  
  let sessionId = localStorage.getItem(storageKey);
  const sessionTimestamp = localStorage.getItem(timestampKey);
  
  if (sessionId && sessionTimestamp) {
    const timestamp = parseInt(sessionTimestamp, 10);
    const age = Date.now() - timestamp;
    
    if (age < SESSION_REUSE_WINDOW) {
      console.log('📊 Carpet: Reusing existing session:', sessionId);
      return sessionId;
    }
  }
  
  sessionId = `cqs_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  localStorage.setItem(storageKey, sessionId);
  localStorage.setItem(timestampKey, Date.now().toString());
  console.log('📊 Carpet: Created new session:', sessionId);
  
  return sessionId;
};

// Get UTM parameters from URL or localStorage
const getUtmParams = () => {
  const storedParams = localStorage.getItem('carpet_quote_utm_params');
  if (storedParams) {
    try {
      const parsed = JSON.parse(storedParams);
      if (parsed.utm_source || parsed.utm_medium || parsed.utm_campaign) {
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
  
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || null,
    utm_medium: params.get('utm_medium') || null,
    utm_campaign: params.get('utm_campaign') || null,
    utm_term: params.get('utm_term') || null,
    utm_content: params.get('utm_content') || null,
  };
};

// Determine source
const determineSource = (): string => {
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source');
  if (utmSource) return utmSource;
  
  if (document.referrer) {
    try {
      const referrerUrl = new URL(document.referrer);
      const hostname = referrerUrl.hostname.toLowerCase();
      
      if (hostname.includes('google')) return 'google';
      if (hostname.includes('facebook') || hostname.includes('fb.com')) return 'facebook';
      if (hostname.includes('instagram')) return 'instagram';
      
      return hostname.replace('www.', '');
    } catch {
      // Invalid referrer
    }
  }
  
  return 'direct';
};

// Format items for storage
const formatItems = (items: CarpetCleaningItem[]): string => {
  if (!items || items.length === 0) return '';
  return items.map(item => {
    const bothSidesText = item.bothSides ? ' (Both sides)' : '';
    return `${item.name}${bothSidesText} x${item.quantity}`;
  }).join(', ');
};

export interface CarpetTrackingOptions {
  isAdminMode?: boolean;
  adminId?: string;
}

export const useCarpetQuoteTracking = (options?: CarpetTrackingOptions) => {
  const { isAdminMode = false, adminId } = options || {};
  const userId = useRef(getUserId());
  const sessionId = useRef(getSessionId());
  const lastSaveRef = useRef<number>(0);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const hasRecordCreated = useRef(false);
  const hasTrackedLanding = useRef(false);

  // Track page landing
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
            event_type: 'carpet_quote_page_view',
            event_data: { service_type: 'carpet_cleaning' },
            page_url: window.location.href,
            referrer: document.referrer || null,
            user_agent: navigator.userAgent,
            ...utmParams,
          },
        }),
      });
      console.log('📊 Carpet: Tracked page landing');
    } catch (err) {
      console.error('❌ Carpet: Error tracking landing:', err);
    }
  }, []);

  // Send heartbeat
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
      console.log('💓 Carpet: Heartbeat sent');
    } catch (err) {
      console.error('❌ Carpet: Heartbeat error:', err);
    }
  }, []);

  // Initialize tracking
  useEffect(() => {
    // Capture UTM params from URL
    const currentParams = new URLSearchParams(window.location.search);
    const hasCurrentUtm = currentParams.get('utm_source') || currentParams.get('utm_medium');
    
    if (hasCurrentUtm) {
      const utmParams = {
        utm_source: currentParams.get('utm_source') || null,
        utm_medium: currentParams.get('utm_medium') || null,
        utm_campaign: currentParams.get('utm_campaign') || null,
        utm_term: currentParams.get('utm_term') || null,
        utm_content: currentParams.get('utm_content') || null,
      };
      localStorage.setItem('carpet_quote_utm_params', JSON.stringify(utmParams));
      localStorage.setItem('carpet_quote_source', utmParams.utm_source?.toLowerCase() || 'website');
    }
    
    trackLanding();

    // Start heartbeat
    heartbeatInterval.current = setInterval(() => {
      if (hasRecordCreated.current) {
        sendHeartbeat();
      }
    }, HEARTBEAT_INTERVAL);

    // Mark as 'left' when user leaves
    const handleBeforeUnload = () => {
      if (!hasRecordCreated.current) return;
      
      if (localStorage.getItem('payment_redirect_in_progress') === 'true') {
        return;
      }
      
      const currentStep = localStorage.getItem('carpet_quote_furthest_step') || 'started';
      if (currentStep === 'booking_completed' || currentStep === 'completed') {
        return;
      }
      
      navigator.sendBeacon(
        `${SUPABASE_URL}/functions/v1/track-funnel-event`,
        JSON.stringify({
          table: 'quote_leads',
          data: {
            user_id: userId.current,
            session_id: sessionId.current,
            service_type: 'carpet_cleaning',
            status: 'left',
            furthest_step: currentStep,
            updated_at: new Date().toISOString(),
          },
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
  }, [trackLanding, sendHeartbeat]);

  // Save quote lead data
  const saveQuoteLead = useCallback(async (data: CarpetCleaningData, currentStep: string, force = false) => {
    const now = Date.now();
    
    if (!force && now - lastSaveRef.current < 2000) {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      debounceTimeout.current = setTimeout(() => {
        saveQuoteLead(data, currentStep, true);
      }, 2000);
      return;
    }
    
    lastSaveRef.current = now;

    try {
      const storedUtmParams = localStorage.getItem('carpet_quote_utm_params');
      const utmParams = storedUtmParams ? JSON.parse(storedUtmParams) : {};
      const source = isAdminMode ? 'admin' : (localStorage.getItem('carpet_quote_source') || determineSource());
      
      // Store furthest step for beforeunload
      localStorage.setItem('carpet_quote_furthest_step', currentStep);
      
      // Format all items as a single string for carpet_items
      const allItems = [
        ...data.carpetItems.map(i => ({ ...i, type: 'carpet' as const })),
        ...data.upholsteryItems.map(i => ({ ...i, type: 'upholstery' as const })),
        ...data.mattressItems.map(i => ({ ...i, type: 'mattress' as const })),
      ];
      
      const leadData: Record<string, unknown> = {
        user_id: userId.current,
        session_id: sessionId.current,
        service_type: 'carpet_cleaning',
        // Store carpet items as JSON in additional_rooms or in a format that works
        carpet_items: formatItems(data.carpetItems),
        upholstery_items: formatItems(data.upholsteryItems),
        mattress_items: formatItems(data.mattressItems),
        selected_date: data.selectedDate instanceof Date 
          ? data.selectedDate.toISOString().split('T')[0] 
          : data.selectedDate,
        selected_time: data.selectedTime,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        postcode: data.postcode,
        address: data.street ? `${data.houseNumber} ${data.street}`.trim() : null,
        property_access: data.propertyAccess,
        access_notes: data.accessNotes,
        calculated_quote: data.totalCost,
        status: 'live',
        furthest_step: currentStep,
        source: source,
        page_url: window.location.href,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        last_heartbeat: new Date().toISOString(),
        ...utmParams,
        updated_at: new Date().toISOString(),
      };

      if (isAdminMode && adminId) {
        leadData.created_by_admin_id = adminId;
        leadData.source = 'admin';
      }

      // Remove undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(leadData).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );

      console.log('📊 Carpet: Saving quote lead:', cleanedData);

      await fetch(`${SUPABASE_URL}/functions/v1/track-funnel-event`, {
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

      hasRecordCreated.current = true;
      console.log('📊 Carpet: Quote lead saved successfully');
    } catch (err) {
      console.error('❌ Carpet: Error saving quote lead:', err);
    }
  }, [isAdminMode, adminId]);

  // Mark as completed
  const markCompleted = useCallback(async (bookingId?: number) => {
    localStorage.setItem('carpet_quote_furthest_step', 'booking_completed');
    
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
            status: 'completed',
            furthest_step: 'booking_completed',
            converted_booking_id: bookingId,
            updated_at: new Date().toISOString(),
          },
        }),
      });
      console.log('📊 Carpet: Marked as completed');
    } catch (err) {
      console.error('❌ Carpet: Error marking completed:', err);
    }
  }, []);

  // Clear session (for starting fresh)
  const clearSession = useCallback(() => {
    localStorage.removeItem('carpet_quote_session_id');
    localStorage.removeItem('carpet_quote_session_timestamp');
    localStorage.removeItem('carpet_quote_furthest_step');
    hasRecordCreated.current = false;
    sessionId.current = getSessionId();
  }, []);

  return {
    sessionId: sessionId.current,
    userId: userId.current,
    saveQuoteLead,
    markCompleted,
    clearSession,
  };
};
