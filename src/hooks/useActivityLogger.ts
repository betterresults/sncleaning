import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useActivityLogger = () => {
  const { user } = useAuth();

  const logActivity = async (
    actionType: string,
    entityType?: string,
    entityId?: string,
    details?: any
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('log_activity', {
        p_user_id: user.id,
        p_action_type: actionType,
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_details: details
      });

      if (error) {
        console.error('Error logging activity:', error);
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  // Specific logging functions for common actions
  const logLogin = () => logActivity('login');
  
  const logLogout = () => logActivity('logout');

  const logBookingView = (bookingId: string) => 
    logActivity('booking_viewed', 'booking', bookingId);

  const logCustomerView = (customerId: string) => 
    logActivity('customer_viewed', 'customer', customerId);

  const logSettingsUpdate = (settingType: string, details?: any) => 
    logActivity('settings_updated', 'settings', settingType, details);

  const logExport = (exportType: string, details?: any) => 
    logActivity('data_exported', 'export', exportType, details);

  const logSearch = (searchTerm: string, searchType: string) => 
    logActivity('search_performed', 'search', searchType, { term: searchTerm });

  return {
    logActivity,
    logLogin,
    logLogout,
    logBookingView,
    logCustomerView,
    logSettingsUpdate,
    logExport,
    logSearch
  };
};