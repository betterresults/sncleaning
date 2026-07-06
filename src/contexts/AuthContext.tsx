
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { devLog } from '@/lib/devLog';

// Supabase fires these purely to keep the access token fresh — on the auto-refresh timer,
// or (per Supabase's own docs) a `SIGNED_IN` event any time a tab/window regains
// visibility/focus, even when the session hasn't actually changed at all. See
// https://github.com/supabase/auth-js/issues/634 and the "SIGNED_IN" entry in
// https://supabase.com/docs/reference/javascript/auth-onauthstatechange ("this may occur even
// when the user is already signed in"). None of these represent an actual sign-in/sign-out or a
// role/relationship change, so (for a user we've already loaded) they should update
// `session`/`user` quietly without flipping `loading`. Consumers like `ProtectedRoute` treat
// `loading` as "unmount the routed page and show a spinner", which was wiping in-progress
// form state every time someone switched tabs/apps and back while mid-edit.
const BACKGROUND_AUTH_EVENTS = new Set<AuthChangeEvent>(['TOKEN_REFRESHED', 'USER_UPDATED', 'SIGNED_IN']);

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  cleanerId: number | null;
  customerId: number | null;
  assignedSources: string[];
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
  const [assignedSources, setAssignedSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  // Tracks whose role/relationships we've most recently loaded, so background auth events
  // (see BACKGROUND_AUTH_EVENTS) for the same already-loaded user can be safely no-ops.
  const lastLoadedUserIdRef = useRef<string | null>(null);

  const fetchUserRole = async (userId: string) => {
    try {
      devLog('Fetching role and relationships for user:', userId);
      
      // Get user profile with cleaner/customer relationships and assigned_sources
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          role,
          cleaner_id,
          customer_id,
          assigned_sources
        `)
        .eq('user_id', userId)
        .single();
      
      devLog('Profile query result:', { profileData, profileError });
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
        devLog('Setting role to guest due to profile error');
        setUserRole('guest');
        return;
      }
      
      // Also try to get from user_roles table
      const { data: userRoleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      devLog('User role query result:', { userRoleData, roleError });
      
      // Determine the final role
      const finalRole = userRoleData?.role || profileData?.role || 'guest';
      
      devLog('Setting user role and relationships:', {
        role: finalRole,
        cleanerId: profileData?.cleaner_id,
        customerId: profileData?.customer_id,
        assignedSources: profileData?.assigned_sources,
        rawUserRoleData: userRoleData,
        rawProfileData: profileData
      });
      
      setUserRole(finalRole);
      setCleanerId(profileData?.cleaner_id || null);
      setCustomerId(profileData?.customer_id || null);
      setAssignedSources(profileData?.assigned_sources || []);
      
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      devLog('Setting role to guest due to catch error');
      setUserRole('guest');
      setCleanerId(null);
      setCustomerId(null);
      setAssignedSources([]);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        devLog('Auth state changed:', event, 'User ID:', session?.user?.id);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const isBackgroundRefreshForKnownUser =
            BACKGROUND_AUTH_EVENTS.has(event) && lastLoadedUserIdRef.current === session.user.id;

          if (isBackgroundRefreshForKnownUser) {
            // Same user we already have role/relationships for — session/user above are
            // already up to date, nothing else needs to change. This is what makes a stray
            // `SIGNED_IN` from a tab refocus (same user, unchanged session) a safe no-op instead
            // of re-triggering the full loading/fetch cycle below.
            devLog('Auth state change is a background refresh for the current user, skipping role refetch');
            return;
          }

          // `loading` may already be `false` from a previous unauthenticated render (e.g. sitting
          // on the login page). Without re-arming it here, consumers like Auth.tsx would briefly see
          // `!loading && user` true while `userRole` is still null — and getRoleHomePath's fallback
          // for an indeterminate role is '/customer-dashboard', so every login (including admins)
          // would flash-redirect there before the real role home path took over.
          setLoading(true);
          // Use setTimeout to defer the async operation and prevent deadlock
          setTimeout(async () => {
            if (mounted) {
              await fetchUserRole(session.user.id);
              lastLoadedUserIdRef.current = session.user.id;
              setLoading(false);
            }
          }, 0);
        } else {
          lastLoadedUserIdRef.current = null;
          setUserRole(null);
          setCleanerId(null);
          setCustomerId(null);
          setAssignedSources([]);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        devLog('Initial session check:', { session: !!session, error });
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserRole(session.user.id);
          lastLoadedUserIdRef.current = session.user.id;
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
      devLog('AuthContext: Starting sign out process...');
      
      // Sign out from Supabase first
      const { error } = await supabase.auth.signOut({
        scope: 'global'
      });
      
      if (error) {
        console.error('Supabase sign out error:', error);
        throw error;
      }
      
      devLog('AuthContext: Supabase sign out successful, clearing local state...');
      
      // Clear local state after successful sign out
      setUser(null);
      setSession(null);
      setUserRole(null);
      setCleanerId(null);
      setCustomerId(null);
      setAssignedSources([]);
      
      devLog('AuthContext: Local state cleared');
      
    } catch (error) {
      console.error('Error during sign out:', error);
      // Even if there's an error, clear local state to prevent being stuck
      setUser(null);
      setSession(null);
      setUserRole(null);
      setCleanerId(null);
      setCustomerId(null);
      setAssignedSources([]);
      throw error; // Re-throw to let caller handle it
    }
  };

  const value = {
    user,
    session,
    userRole,
    cleanerId,
    customerId,
    assignedSources,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
