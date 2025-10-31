import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronDown, ChevronRight } from 'lucide-react';
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
import { useAvailableBookingsCount } from '@/hooks/useAvailableBookingsCount';
import { useQuery } from '@tanstack/react-query';

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
  showCount?: boolean;
  countKey?: string;
}

interface UnifiedSidebarProps {
  navigationItems: NavigationItem[];
  user: any;
  userRole?: string;
  customerId?: number | null;
  cleanerId?: number | null;
  onSignOut: () => void;
}

export function UnifiedSidebar({ navigationItems, user, userRole, customerId, cleanerId, onSignOut }: UnifiedSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { open, setOpen } = useSidebar();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { data: availableCount } = useAvailableBookingsCount();

  console.log('UnifiedSidebar render:', { open, hasUser: !!user, hasOnSignOut: !!onSignOut, availableCount });

  return (
    <Sidebar 
      className="border-r-0 bg-[#185166] flex flex-col h-screen" 
      collapsible="offcanvas"
      side="left"
      variant="sidebar"
      style={{ width: '220px', minWidth: '220px' }}
    >
      <SidebarHeader className="border-b border-white/10 bg-[#185166] px-4 py-4 flex-shrink-0">
        <div className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-[#1abc9c]">SN</span>
          <span>Cleaning</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-0 bg-[#185166] flex-1 overflow-y-auto min-h-0">
        <SidebarGroup className="h-full">
          <SidebarGroupContent className="px-2 py-1 h-full">
            <SidebarMenu className="space-y-0.5 h-full">
              {navigationItems.map((item) => {
                const isActive = item.url && location.pathname === item.url && !item.disabled;
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isExpanded = expandedItems.includes(item.title);
                
                // Check if any subitem is active
                const hasActiveSubItem = hasSubItems && item.subItems?.some(subItem => 
                  location.pathname === subItem.url
                );

                const toggleExpanded = () => {
                  if (hasSubItems) {
                    setExpandedItems(prev => 
                      prev.includes(item.title) 
                        ? prev.filter(title => title !== item.title)
                        : [...prev, item.title]
                    );
                  }
                };

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild={!item.disabled && !hasSubItems}
                      onClick={hasSubItems ? toggleExpanded : undefined}
                      className={`h-10 transition-all duration-200 border-0 justify-start px-3 rounded-md font-medium text-sm ${
                        isActive || hasActiveSubItem
                          ? "!bg-[#1abc9c] !text-white" 
                          : "!text-white/90 hover:!text-white hover:!bg-white/10"
                      } ${item.disabled ? "opacity-60 cursor-not-allowed" : ""} ${hasSubItems ? "cursor-pointer" : ""}`}
                    >
                      {item.disabled ? (
                        <div className="flex items-center w-full">
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          <div className="ml-3 flex flex-col">
                            <span className="font-medium text-base leading-tight">
                              {item.title}
                            </span>
                            {item.subtitle && (
                              <span className="text-sm opacity-70">
                                {item.subtitle}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : hasSubItems ? (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            <span className="ml-3 font-medium text-base leading-tight">
                              {item.title}
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 flex-shrink-0" />
                          )}
                        </div>
                      ) : (
                        <Link 
                          to={item.url!} 
                          className="flex items-center w-full justify-between"
                          onClick={() => setOpen?.(false)} // Close sidebar on navigation
                        >
                          <div className="flex items-center">
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            <span className="ml-3 font-medium text-base leading-tight">
                              {item.title}
                            </span>
                          </div>
                          {item.showCount && item.countKey === 'available-bookings-count' && availableCount && availableCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full ml-2 flex-shrink-0">
                              {availableCount}
                            </span>
                          )}
                        </Link>
                      )}
                    </SidebarMenuButton>
                    
                    {hasSubItems && isExpanded && (
                      <SidebarMenuSub className="mt-0.5 ml-0 border-0">
                        {item.subItems?.map((subItem) => {
                          const isSubActive = location.pathname === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton 
                                asChild
                                className={`h-10 transition-all duration-200 rounded-md px-3 font-medium text-sm ml-6 ${
                                  isSubActive
                                    ? "!bg-white/20 !text-white"
                                    : "!text-white/90 hover:!text-white hover:!bg-white/10"
                                }`}
                              >
                                <Link to={subItem.url} className="flex items-center w-full">
                                  <subItem.icon className="h-4 w-4 flex-shrink-0 !text-white/80" />
                                  <span className="ml-3 leading-tight">
                                    {subItem.title}
                                  </span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter 
        className="border-t border-white/10 bg-[#185166] px-3 py-3 flex-shrink-0 min-h-[100px] !block !visible !opacity-100" 
        style={{ 
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          position: 'sticky',
          bottom: 0,
          zIndex: 10
        }}
      >
        <div className="space-y-2 w-full">
          <div 
            className="transition-all duration-200 hover:bg-white/10 text-white hover:text-white border-0 justify-start px-2 py-2 rounded-lg cursor-pointer flex items-center w-full"
            onClick={() => {
              console.log('Profile clicked, userRole:', userRole, 'customerId:', customerId);
              // Navigate to appropriate settings page based on user role and IDs
              let settingsUrl = '/admin-settings'; // default
              
              if (customerId || userRole === 'guest') {
                settingsUrl = '/customer-settings';
              } else if (userRole === 'user' || cleanerId) {
                settingsUrl = '/cleaner-settings';
              } else if (userRole === 'admin') {
                settingsUrl = '/admin-settings';
              }
              
              console.log('Redirecting to:', settingsUrl);
              navigate(settingsUrl);
            }}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-[#1abc9c] to-[#16a085] rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="ml-2.5 flex flex-col items-start min-w-0 flex-1">
              <span className="text-sm font-semibold text-white truncate w-full leading-tight">
                {user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Admin'}
              </span>
              <span className="text-xs text-white/70 truncate w-full">
                View profile
              </span>
            </div>
          </div>
          
          <Button 
            onClick={() => {
              console.log('Logout clicked');
              onSignOut();
              setOpen?.(false); // Close sidebar after logout
            }} 
            className="w-full h-10 font-medium text-sm bg-white/10 text-white border-white/30 hover:bg-white/15 hover:text-white hover:border-white/50 transition-all duration-200 rounded-lg"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}