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
  const getGreeting = () => {
    const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User';
    
    if (userRole === 'admin') {
      return `Hello ${firstName}`;
    } else if (userRole === 'user') {
      return `Hello ${firstName}`;
    } else {
      return `Hello ${firstName}`;
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-white/10 bg-[#185166] px-4 shadow-sm">
      <SidebarTrigger className="-ml-1 p-2 text-white hover:bg-white/10 hover:text-white border-0 bg-transparent" />
      <div className="flex-1" />
      <div className="text-base font-semibold text-white truncate">
        {title}
      </div>
      <div className="flex-1 flex justify-end items-center gap-3">
        <div className="text-sm text-white/80 truncate">
          {getGreeting()}
        </div>
        {isMobile && onSignOut && (
          <Button
            onClick={onSignOut}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-white hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
}