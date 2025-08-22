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
      <SidebarHeader className="border-b border-white/10 bg-[#185166] px-6 py-6">
        <div className="text-xl font-semibold text-white tracking-wide">
          SN Cleaning
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-0 bg-[#185166]">
        <SidebarGroup>
          <SidebarGroupContent className="px-4 py-4">
            <SidebarMenu className="space-y-3">
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
                      className={`h-14 transition-all duration-300 border-0 justify-start px-5 rounded-xl font-medium text-base ${
                        isActive || hasActiveSubItem
                          ? "!bg-white !text-[#185166] shadow-lg hover:!bg-white hover:!text-[#185166] border-l-4 border-[#18A5A5]" 
                          : "!text-white hover:!text-white hover:!bg-white/15"
                      } ${item.disabled ? "opacity-60 cursor-not-allowed" : ""} ${hasSubItems ? "cursor-pointer" : ""}`}
                    >
                      {item.disabled ? (
                        <div className="flex items-center w-full">
                          <item.icon className="h-6 w-6 flex-shrink-0" />
                          <div className="ml-4 flex flex-col">
                            <span className="font-medium text-base leading-tight">
                              {item.title}
                            </span>
                            {item.subtitle && (
                              <span className="text-sm opacity-70 mt-0.5">
                                {item.subtitle}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : hasSubItems ? (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <item.icon className="h-6 w-6 flex-shrink-0" />
                            <span className="ml-4 font-medium text-base leading-tight">
                              {item.title}
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </div>
                      ) : (
                        <Link to={item.url!} className="flex items-center w-full">
                          <item.icon className="h-6 w-6 flex-shrink-0" />
                          <span className="ml-4 font-medium text-base leading-tight">
                            {item.title}
                          </span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                    
                    {hasSubItems && isExpanded && (
                      <SidebarMenuSub className="mt-2 ml-2">
                        {item.subItems?.map((subItem) => {
                          const isSubActive = location.pathname === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton 
                                asChild
                                className={`h-12 transition-all duration-300 rounded-lg mb-1 px-4 font-medium text-sm ${
                                  isSubActive
                                    ? "!bg-white/20 !text-white border-l-3 border-[#18A5A5] ml-2"
                                    : "!text-white/80 hover:!text-white hover:!bg-white/10"
                                }`}
                              >
                                <Link to={subItem.url} className="flex items-center w-full">
                                  <subItem.icon className="h-5 w-5 flex-shrink-0 ml-2" />
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

      <SidebarFooter className="border-t border-white/10 bg-[#185166] px-5 py-6">
        <SidebarMenu className="space-y-4">
          <SidebarMenuItem>
            <SidebarMenuButton 
              className="transition-all duration-300 hover:bg-white/10 !text-white hover:!text-white border-0 justify-start px-4 py-4 rounded-xl h-auto"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#18A5A5] to-[#18A5A5]/80 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4 flex flex-col items-start min-w-0">
                <span className="text-base font-semibold !text-white truncate w-full leading-tight">
                  {user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User'}
                </span>
                <span className="text-sm !text-white/70 truncate w-full mt-0.5">
                  View profile
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Button 
              onClick={onSignOut} 
              className="w-full h-12 font-semibold text-base !bg-white/10 !text-white border-white/30 hover:!bg-white/20 hover:!text-white hover:border-white/50 transition-all duration-300 rounded-xl"
            >
              Sign out
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}