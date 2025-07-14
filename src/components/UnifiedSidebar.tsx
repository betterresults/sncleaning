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
      <SidebarHeader className="border-b border-white/10 bg-[#185166] px-6 py-4">
        <div className="text-lg font-bold text-white">
          SN Cleaning
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-0 bg-[#185166]">
        <SidebarGroup>
          <SidebarGroupContent className="px-3 py-2">
            <SidebarMenu className="space-y-1">
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
                      className={`h-12 transition-all duration-200 border-0 justify-start px-4 rounded-lg mx-2 ${
                        isActive || hasActiveSubItem
                          ? "!bg-white/20 !text-white shadow-sm hover:!bg-white/25 hover:!text-white" 
                          : "!text-white/90 hover:!text-white hover:!bg-white/10"
                      } ${item.disabled ? "opacity-60 cursor-not-allowed" : ""} ${hasSubItems ? "cursor-pointer" : ""}`}
                    >
                      {item.disabled ? (
                        <div className="flex items-center w-full !text-white">
                          <item.icon className="h-5 w-5 flex-shrink-0 !text-white" />
                          <div className="ml-3 flex flex-col">
                            <span className="font-medium text-sm !text-white">
                              {item.title}
                            </span>
                            {item.subtitle && (
                              <span className="text-xs !text-white/60">
                                {item.subtitle}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : hasSubItems ? (
                        <div className="flex items-center justify-between w-full !text-white hover:!text-white">
                          <div className="flex items-center">
                            <item.icon className="h-5 w-5 flex-shrink-0 !text-white" />
                            <span className="ml-3 font-medium text-sm !text-white">
                              {item.title}
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 !text-white" />
                          ) : (
                            <ChevronRight className="h-4 w-4 !text-white" />
                          )}
                        </div>
                      ) : (
                        <Link to={item.url!} className="flex items-center w-full !text-white hover:!text-white">
                          <item.icon className="h-5 w-5 flex-shrink-0 !text-white" />
                          <span className="ml-3 font-medium text-sm !text-white">
                            {item.title}
                          </span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                    
                    {hasSubItems && isExpanded && (
                      <SidebarMenuSub>
                        {item.subItems?.map((subItem) => {
                          const isSubActive = location.pathname === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton 
                                asChild
                                isActive={isSubActive}
                                className="!text-white/80 hover:!text-white hover:!bg-white/10"
                              >
                                <Link to={subItem.url} className="flex items-center w-full">
                                  <subItem.icon className="h-4 w-4 flex-shrink-0 !text-white/80" />
                                  <span className="ml-2 text-sm">
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

      <SidebarFooter className="border-t border-white/10 bg-[#185166] px-4 py-6">
        <SidebarMenu className="space-y-4">
          <SidebarMenuItem>
            <SidebarMenuButton 
              className="transition-all duration-200 hover:bg-white/10 !text-white hover:!text-white border-0 justify-start px-4 py-4 rounded-lg"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-[#18A5A5] to-[#18A5A5]/80 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="ml-3 flex flex-col items-start min-w-0">
                <span className="text-sm font-medium !text-white truncate w-full">
                  {user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User'}
                </span>
                <span className="text-xs !text-white/60 truncate w-full">
                  {user?.email}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Button 
              onClick={onSignOut} 
              className="w-full h-11 font-medium !bg-white/10 !text-white border-white/30 hover:!bg-white/20 hover:!text-white hover:border-white/50 transition-all duration-200"
            >
              Sign Out
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}