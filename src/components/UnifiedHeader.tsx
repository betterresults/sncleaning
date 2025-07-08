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
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-white px-4 shadow-sm">
      <SidebarTrigger className="-ml-1 p-2" />
      <div className="flex-1" />
      <div className="text-base font-semibold text-gray-900 truncate">
        {title}
      </div>
      <div className="flex-1 flex justify-end">
        <div className="text-sm text-gray-600">
          {getGreeting()}
        </div>
      </div>
    </header>
  );
}