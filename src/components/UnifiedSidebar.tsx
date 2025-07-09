import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Menu } from 'lucide-react';
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
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

interface NavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
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
      <SidebarHeader className={`border-b border-white/10 bg-[#185166] ${open ? "px-6 py-4" : "px-4 py-4"}`}>
        {open && (
          <div className="text-lg font-bold text-white">
            SN Cleaning
          </div>
        )}
        {!open && (
          <div className="text-sm font-bold text-white text-center">
            SN
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent className="p-0 bg-[#185166]">
        <SidebarGroup>
          <SidebarGroupContent className="px-3 py-2">
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      className={`h-12 transition-all duration-200 border-0 ${
                        isActive 
                          ? "!bg-white/20 !text-white shadow-sm hover:!bg-white/25 hover:!text-white" 
                          : "!text-white/90 hover:!text-white hover:!bg-white/10"
                      } ${
                        open 
                          ? "justify-start px-4 rounded-lg mx-2" 
                          : "justify-center rounded-lg mx-2 w-12 h-12 p-[0.15rem]"
                      }`}
                    >
                      <Link to={item.url} className="flex items-center w-full !text-white hover:!text-white">
                        <item.icon className={`${open ? "h-5 w-5" : "h-6 w-6"} flex-shrink-0 !text-white ${!open ? 'mx-auto' : ''}`} />
                        {open && (
                          <span className="ml-3 font-medium text-sm !text-white">
                            {item.title}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={`border-t border-white/10 bg-[#185166] ${open ? "px-4 py-6" : "px-3 py-6"}`}>
        <SidebarMenu className="space-y-4">
          <SidebarMenuItem>
            <SidebarMenuButton 
              className={`transition-all duration-200 hover:bg-white/10 !text-white hover:!text-white border-0 ${
                open ? "justify-start px-4 py-4 rounded-lg" : "justify-center px-3 py-4 rounded-lg mx-auto w-12"
              }`}
            >
              <div className={`w-8 h-8 bg-gradient-to-br from-[#18A5A5] to-[#18A5A5]/80 rounded-full flex items-center justify-center flex-shrink-0 ${
                open ? "" : "mx-auto"
              }`}>
                <User className="h-4 w-4 text-white" />
              </div>
              {open && (
                <div className="ml-3 flex flex-col items-start min-w-0">
                  <span className="text-sm font-medium !text-white truncate w-full">
                    {user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User'}
                  </span>
                  <span className="text-xs !text-white/60 truncate w-full">
                    {user?.email}
                  </span>
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
          {open && (
            <SidebarMenuItem>
              <Button 
                onClick={onSignOut} 
                className="w-full h-11 font-medium !bg-white/10 !text-white border-white/30 hover:!bg-white/20 hover:!text-white hover:border-white/50 transition-all duration-200"
              >
                Sign Out
              </Button>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}