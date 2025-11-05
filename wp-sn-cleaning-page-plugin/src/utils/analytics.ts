// Analytics tracking utility
export interface ClickEvent {
  action: string;
  section: 'header' | 'footer';
  label: string;
  timestamp: number;
  url?: string;
}

export interface TrackEvent {
  event: string;
  properties: Record<string, any>;
}

// Store events in localStorage for now (can be integrated with Google Analytics, etc. later)
const STORAGE_KEY = 'sn_cleaning_analytics';

export const trackClick = (action: string, section: 'header' | 'footer', label: string, url?: string) => {
  const event: ClickEvent = {
    action,
    section,
    label,
    timestamp: Date.now(),
    url
  };

  // Log to console for immediate visibility
  console.log('🔍 Click Tracked:', event);

  // Store in localStorage
  try {
    const existingEvents = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existingEvents.push(event);
    
    // Keep only last 1000 events to prevent storage overflow
    if (existingEvents.length > 1000) {
      existingEvents.splice(0, existingEvents.length - 1000);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingEvents));
  } catch (error) {
    console.error('Failed to store analytics event:', error);
  }

  // You can add integration with Google Analytics, Facebook Pixel, etc. here
  // Example: gtag('event', action, { event_category: section, event_label: label });
};

export const getAnalyticsData = (): ClickEvent[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (error) {
    console.error('Failed to retrieve analytics data:', error);
    return [];
  }
};

export const clearAnalyticsData = () => {
  localStorage.removeItem(STORAGE_KEY);
  console.log('Analytics data cleared');
};

// Helper function to get analytics summary
export const getAnalyticsSummary = () => {
  const events = getAnalyticsData();
  const summary = {
    totalClicks: events.length,
    headerClicks: events.filter(e => e.section === 'header').length,
    footerClicks: events.filter(e => e.section === 'footer').length,
    topActions: {} as Record<string, number>,
    recentEvents: events.slice(-10).reverse()
  };

  // Count action frequencies
  events.forEach(event => {
    const key = `${event.section}_${event.action}`;
    summary.topActions[key] = (summary.topActions[key] || 0) + 1;
  });

  return summary;
};

// General event tracking function
export const trackEvent = (event: string, properties: Record<string, any> = {}) => {
  const eventData = {
    event,
    properties: {
      ...properties,
      timestamp: Date.now(),
      url: window.location.href
    }
  };

  // Log to console for immediate visibility
  console.log('📊 Event Tracked:', eventData);

  // Store in localStorage
  try {
    const storageKey = 'sn_cleaning_events';
    const existingEvents = JSON.parse(localStorage.getItem(storageKey) || '[]');
    existingEvents.push(eventData);
    
    // Keep only last 1000 events to prevent storage overflow
    if (existingEvents.length > 1000) {
      existingEvents.splice(0, existingEvents.length - 1000);
    }
    
    localStorage.setItem(storageKey, JSON.stringify(existingEvents));
  } catch (error) {
    console.error('Failed to store event:', error);
  }

  // You can add integration with Google Analytics, Facebook Pixel, etc. here
  // Example: gtag('event', event, properties);
};
