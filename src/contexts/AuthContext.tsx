
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  cleanerId: number | null;
  customerId: number | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [cleanerId, setCleanerId] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    try {
      console.log('Fetching role and relationships for user:', userId);
      
      // Get user profile with cleaner/customer relationships
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          role,
          cleaner_id,
          customer_id
        `)
        .eq('user_id', userId)
        .single();
      
      console.log('Profile query result:', { profileData, profileError });
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
        console.log('Setting role to guest due to profile error');
        setUserRole('guest');
        return;
      }
      
      // Also try to get from user_roles table
      const { data: userRoleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      console.log('User role query result:', { userRoleData, roleError });
      
      // Determine the final role
      const finalRole = userRoleData?.role || profileData?.role || 'guest';
      
      console.log('Setting user role and relationships:', {
        role: finalRole,
        cleanerId: profileData?.cleaner_id,
        customerId: profileData?.customer_id,
        rawUserRoleData: userRoleData,
        rawProfileData: profileData
      });
      
      setUserRole(finalRole);
      setCleanerId(profileData?.cleaner_id || null);
      setCustomerId(profileData?.customer_id || null);
      
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      console.log('Setting role to guest due to catch error');
      setUserRole('guest');
      setCleanerId(null);
      setCustomerId(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, 'User ID:', session?.user?.id);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Log login activity
          try {
            await supabase.rpc('log_activity', {
              p_user_id: session.user.id,
              p_action_type: 'login',
              p_entity_type: null,
              p_entity_id: null,
              p_details: null
            });
          } catch (error) {
            console.error('Error logging login activity:', error);
          }
          
          // Use setTimeout to defer the async operation and prevent deadlock
          setTimeout(async () => {
            if (mounted) {
              await fetchUserRole(session.user.id);
              setLoading(false);
            }
          }, 0);
        } else {
          // Log logout activity for previous user if exists
          if (user) {
            try {
              await supabase.rpc('log_activity', {
                p_user_id: user.id,
                p_action_type: 'logout',
                p_entity_type: null,
                p_entity_id: null,
                p_details: null
              });
            } catch (error) {
              console.error('Error logging logout activity:', error);
            }
          }
          
          setUserRole(null);
          setCleanerId(null);
          setCustomerId(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Initial session check:', { session: !!session, error });
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserRole(session.user.id);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error checking session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('AuthContext: Starting sign out process...');
      
      // Sign out from Supabase first
      const { error } = await supabase.auth.signOut({
        scope: 'global'
      });
      
      if (error) {
        console.error('Supabase sign out error:', error);
        throw error;
      }
      
      console.log('AuthContext: Supabase sign out successful, clearing local state...');
      
      // Clear local state after successful sign out
      setUser(null);
      setSession(null);
      setUserRole(null);
      setCleanerId(null);
      setCustomerId(null);
      
      console.log('AuthContext: Local state cleared');
      
    } catch (error) {
      console.error('Error during sign out:', error);
      // Even if there's an error, clear local state to prevent being stuck
      setUser(null);
      setSession(null);
      setUserRole(null);
      setCleanerId(null);
      setCustomerId(null);
      throw error; // Re-throw to let caller handle it
    }
  };

  const value = {
    user,
    session,
    userRole,
    cleanerId,
    customerId,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
