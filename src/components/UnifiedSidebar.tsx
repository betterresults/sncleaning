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
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  return (
    <Sidebar className="border-r-0 bg-[#185166]" collapsible="offcanvas">
      <SidebarHeader className="border-b border-white/10 bg-[#185166] px-4 py-3">
        <div className="text-lg font-semibold text-white">
          SN Cleaning
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-0 bg-[#185166]">
        <SidebarGroup>
          <SidebarGroupContent className="px-2 py-1">
            <SidebarMenu className="space-y-0.5">
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
                      className={`h-10 transition-all duration-200 border-0 justify-start px-3 rounded-lg font-medium text-sm ${
                        isActive || hasActiveSubItem
                          ? "!bg-white/15 !text-white" 
                          : "!text-white/90 hover:!text-white hover:!bg-white/8"
                      } ${item.disabled ? "opacity-60 cursor-not-allowed" : ""} ${hasSubItems ? "cursor-pointer" : ""}`}
                    >
                      {item.disabled ? (
                        <div className="flex items-center w-full">
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <div className="ml-2.5 flex flex-col">
                            <span className="font-medium text-sm leading-tight">
                              {item.title}
                            </span>
                            {item.subtitle && (
                              <span className="text-xs opacity-70">
                                {item.subtitle}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : hasSubItems ? (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            <span className="ml-2.5 font-medium text-sm leading-tight">
                              {item.title}
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </div>
                      ) : (
                        <Link to={item.url!} className="flex items-center w-full">
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="ml-2.5 font-medium text-sm leading-tight">
                            {item.title}
                          </span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                    
                    {hasSubItems && isExpanded && (
                      <SidebarMenuSub className="mt-0.5">
                        {item.subItems?.map((subItem) => {
                          const isSubActive = location.pathname === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton 
                                asChild
                                className={`h-9 transition-all duration-200 rounded-md px-3 font-medium text-xs ml-3 ${
                                  isSubActive
                                    ? "!bg-white/15 !text-white"
                                    : "!text-white/80 hover:!text-white hover:!bg-white/8"
                                }`}
                              >
                                <Link to={subItem.url} className="flex items-center w-full">
                                  <subItem.icon className="h-3 w-3 flex-shrink-0" />
                                  <span className="ml-2 leading-tight">
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

      <SidebarFooter className="border-t border-white/10 bg-[#185166] px-3 py-3">
        <SidebarMenu className="space-y-2">
          <SidebarMenuItem>
            <SidebarMenuButton 
              className="transition-all duration-200 hover:bg-white/8 !text-white hover:!text-white border-0 justify-start px-2 py-2 rounded-lg h-auto"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-[#18A5A5] to-[#18A5A5]/80 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="ml-2.5 flex flex-col items-start min-w-0">
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
              className="w-full h-9 font-medium text-sm !bg-white/10 !text-white border-white/30 hover:!bg-white/15 hover:!text-white hover:border-white/50 transition-all duration-200 rounded-lg"
            >
              Sign out
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}