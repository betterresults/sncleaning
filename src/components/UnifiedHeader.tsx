import React from 'react';
import { LogOut } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface UnifiedHeaderProps {
  title: string;
  user: any;
  userRole?: string;
  onSignOut?: () => void;
}

export function UnifiedHeader({ title, user, userRole, onSignOut }: UnifiedHeaderProps) {
  const isMobile = useIsMobile();
  
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
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b border-white/10 bg-[#185166] px-2 sm:px-4 shadow-sm" style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}>
      <SidebarTrigger className="-ml-1 p-2 text-white hover:bg-white/10 hover:text-white border-0 bg-transparent flex-shrink-0" />
      
      <div className="flex-1 text-center">
        <div className="text-sm sm:text-base font-semibold text-white truncate px-2">
          {title}
        </div>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0" style={{ paddingRight: 'max(0px, env(safe-area-inset-right))' }}>
        <div className="hidden sm:block text-sm text-white/80 truncate max-w-24">
          {getGreeting()}
        </div>
        {onSignOut && (
          <Button
            onClick={onSignOut}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-white hover:bg-white/10 hover:text-white flex-shrink-0 border border-white/20"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
}