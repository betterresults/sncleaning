
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, History, DollarSign, User, Briefcase } from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

export function CleanerSidebar() {
  const { user, signOut, cleanerId } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    {
      title: "My Bookings",
      url: "/cleaner-dashboard",
      icon: Calendar,
    },
    {
      title: "Available Bookings",
      url: "/cleaner-available-bookings",
      icon: Briefcase,
    },
    {
      title: "Past Bookings",
      url: "/cleaner-past-bookings",
      icon: History,
    },
    {
      title: "My Earnings",
      url: "/cleaner-earnings",
      icon: DollarSign,
    },
  ];

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="p-4 border-b border-gray-200">
        <div className="text-lg font-semibold text-gray-900">
          SN Cleaning
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location.pathname === item.url}
                    className="w-full h-12 px-3 py-2 text-sm"
                  >
                    <Link to={item.url} className="flex items-center gap-3 w-full">
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-gray-200">
        <SidebarMenu className="space-y-2">
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-auto">
              <div className="flex items-center gap-2 p-2">
                <User className="h-4 w-4 flex-shrink-0" />
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-xs text-gray-600 truncate w-full">{user?.email}</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Button 
              onClick={handleSignOut} 
              variant="outline" 
              size="sm" 
              className="w-full h-9"
            >
              Sign Out
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
