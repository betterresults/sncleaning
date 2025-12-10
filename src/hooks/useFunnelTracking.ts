import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Generate or retrieve session ID (shared with quote lead tracking)
const getSessionId = (): string => {
  const storageKey = 'funnel_session_id';
  let sessionId = sessionStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = `fs_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
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

export const useFunnelTracking = () => {
  const sessionId = useRef(getSessionId());
  const hasTrackedPageView = useRef(false);

  const trackEvent = useCallback(async (
    eventType: string,
    eventData: Record<string, unknown> = {}
  ) => {
    try {
      const utmParams = getUtmParams();
      
      const eventRecord = {
        session_id: sessionId.current,
        event_type: eventType,
        event_data: eventData,
        page_url: window.location.href,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        ...utmParams,
      };

      console.log('📊 Tracking funnel event:', eventType, eventRecord);

      const { error } = await supabase
        .from('funnel_events')
        .insert(eventRecord as any);

      if (error) {
        console.error('❌ Error tracking funnel event:', error);
      } else {
        console.log('✅ Funnel event tracked successfully');
      }
    } catch (err) {
      console.error('❌ Error in trackEvent:', err);
    }
  }, []);

  const trackPageView = useCallback((pageName: string, additionalData?: Record<string, unknown>) => {
    if (hasTrackedPageView.current) return;
    hasTrackedPageView.current = true;
    trackEvent('page_view', { page: pageName, ...additionalData });
  }, [trackEvent]);

  const trackServiceClick = useCallback((serviceId: string, serviceName: string) => {
    trackEvent('service_click', { service_id: serviceId, service_name: serviceName });
  }, [trackEvent]);

  const trackFormStart = useCallback((formType: string) => {
    trackEvent('form_started', { form_type: formType });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackServiceClick,
    trackFormStart,
    sessionId: sessionId.current,
  };
};
