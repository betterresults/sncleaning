import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface UnifiedHeaderProps {
  title: string;
  user: any;
  userRole?: string;
}

export function UnifiedHeader({ title, user, userRole }: UnifiedHeaderProps) {
  const getGreeting = () => {
    const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User';
    
    if (userRole === 'admin') {
      return `Hello ${firstName} (Admin)`;
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
      <div className="flex-1 flex justify-end">
        <div className="text-sm text-white/80 truncate">
          {getGreeting()}
        </div>
      </div>
    </header>
  );
}