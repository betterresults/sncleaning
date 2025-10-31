import React from 'react';
import { LogOut, ArrowLeft } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';

interface UnifiedHeaderProps {
  title: string;
  user: any;
  userRole?: string;
  onSignOut?: () => void;
  showBackToAdmin?: boolean;
}

export function UnifiedHeader({ title, user, userRole, onSignOut, showBackToAdmin }: UnifiedHeaderProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  console.log('UnifiedHeader render:', { isMobile, hasOnSignOut: !!onSignOut });
  const getGreeting = () => {
    // For customers, try to get the name from user metadata or email
    // For admins, show "Admin" or their actual name if available
    if (userRole === 'admin') {
      const adminName = user?.user_metadata?.first_name || 'Admin';
      return `Hello ${adminName}`;
    } else {
      const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User';
      return `Hello ${firstName}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b border-white/10 bg-[#2c3e50] px-4 sm:px-6 shadow-sm" style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}>
      <SidebarTrigger className="-ml-1 p-2 text-white hover:bg-white/10 hover:text-white border-0 bg-transparent flex-shrink-0" />
      
      {showBackToAdmin && (
        <Button
          onClick={() => navigate('/dashboard')}
          size="sm"
          variant="ghost"
          className="h-8 gap-1 px-2 text-white hover:bg-white/10 hover:text-white flex-shrink-0 border border-white/20"
          title="Върни се към Admin Dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Admin</span>
        </Button>
      )}
      
      <div className="flex-1 flex items-center">
        <div className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-[#1abc9c]">SN</span>
          <span>Cleaning</span>
        </div>
        {title && (
          <div className="ml-4 text-sm sm:text-base font-semibold text-white/80 truncate px-2">
            {title}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-3 flex-shrink-0" style={{ paddingRight: 'max(0px, env(safe-area-inset-right))' }}>
        <div className="hidden sm:block text-sm text-white/80 truncate">
          {getGreeting()}
        </div>
        
        <NotificationBell />
        
        {onSignOut && (
          <Button
            onClick={onSignOut}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-white hover:bg-white/10 hover:text-white flex-shrink-0 border border-white/20 rounded-full"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
}