import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useActivityLogger = () => {
  const { user, userRole } = useAuth();

  const logActivity = async (
    actionType: string,
    entityType?: string,
    entityId?: string,
    details?: Record<string, any>
  ) => {
    // Only log if user is authenticated
    if (!user?.id) return;

    try {
      // Call the existing log_activity database function
      await supabase.rpc('log_activity', {
        p_user_id: user.id,
        p_action_type: actionType,
        p_entity_type: entityType || null,
        p_entity_id: entityId || null,
        p_details: details || null
      });
    } catch (error) {
      // Silently fail - don't break the app if logging fails
      console.warn('Failed to log activity:', error);
    }
  };

  // Utility functions for common actions
  const logPageVisit = (pageName: string) => {
    logActivity('page_visit', 'page', pageName, {
      url: window.location.pathname,
      timestamp: new Date().toISOString()
    });
  };

  const logSearch = (searchTerm: string, resultCount?: number) => {
    logActivity('search', 'search', searchTerm, {
      search_term: searchTerm,
      result_count: resultCount,
      page: window.location.pathname
    });
  };

  const logFormSubmission = (formName: string, formData?: Record<string, any>) => {
    logActivity('form_submission', 'form', formName, {
      form_name: formName,
      form_data: formData
    });
  };

  const logFileUpload = (fileName: string, fileType: string, entityId?: string) => {
    logActivity('file_upload', 'file', fileName, {
      file_name: fileName,
      file_type: fileType,
      entity_id: entityId
    });
  };

  const logLogin = () => {
    logActivity('user_login', 'auth', user?.id, {
      user_email: user?.email,
      user_role: userRole
    });
  };

  const logLogout = () => {
    logActivity('user_logout', 'auth', user?.id, {
      user_email: user?.email,
      user_role: userRole
    });
  };

  return {
    logActivity,
    logPageVisit,
    logSearch,
    logFormSubmission,
    logFileUpload,
    logLogin,
    logLogout
  };
};