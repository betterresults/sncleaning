import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Menu, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

interface NavigationSubItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavigationItem {
  title: string;
  url?: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  subtitle?: string;
  subItems?: NavigationSubItem[];
}

interface UnifiedSidebarProps {
  navigationItems: NavigationItem[];
  user: any;
  onSignOut: () => void;
}

export function UnifiedSidebar({ navigationItems, user, onSignOut }: UnifiedSidebarProps) {
  const location = useLocation();
  const { open } = useSidebar();

  return (
    <Sidebar className="border-r-0 bg-[#185166]" collapsible="offcanvas">
      <SidebarHeader className="border-b border-white/10 bg-[#185166] px-6 py-4">
        <div className="text-xl font-semibold text-white tracking-wide">
          SN Cleaning
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-0 bg-[#185166]">
        <SidebarGroup>
          <SidebarGroupContent className="px-3 py-2">
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = item.url && location.pathname === item.url && !item.disabled;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild={!item.disabled}
                      className={`h-11 transition-all duration-200 border-0 justify-start px-4 rounded-lg mx-1 font-medium text-sm ${
                        isActive
                          ? "!bg-white/15 !text-white border-l-3 border-[#18A5A5] shadow-sm" 
                          : "!text-white/90 hover:!text-white hover:!bg-white/8"
                      } ${item.disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      {item.disabled ? (
                        <div className="flex items-center w-full">
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          <div className="ml-3 flex flex-col">
                            <span className="font-medium text-sm leading-tight">
                              {item.title}
                            </span>
                            {item.subtitle && (
                              <span className="text-xs opacity-70 mt-0.5">
                                {item.subtitle}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <Link to={item.url!} className="flex items-center w-full">
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          <span className="ml-3 font-medium text-sm leading-tight">
                            {item.title}
                          </span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 bg-[#185166] px-4 py-4">
        <SidebarMenu className="space-y-3">
          <SidebarMenuItem>
            <SidebarMenuButton 
              className="transition-all duration-200 hover:bg-white/8 !text-white hover:!text-white border-0 justify-start px-3 py-3 rounded-lg h-auto"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-[#18A5A5] to-[#18A5A5]/80 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="ml-3 flex flex-col items-start min-w-0">
                <span className="text-sm font-semibold !text-white truncate w-full leading-tight">
                  {user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Admin'}
                </span>
                <span className="text-xs !text-white/70 truncate w-full">
                  View profile
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Button 
              onClick={onSignOut} 
              className="w-full h-10 font-medium text-sm !bg-white/10 !text-white border-white/30 hover:!bg-white/15 hover:!text-white hover:border-white/50 transition-all duration-200 rounded-lg"
            >
              Sign out
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}