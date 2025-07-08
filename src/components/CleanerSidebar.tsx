
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, History, DollarSign, User, Briefcase, MapPin, MessageCircle } from 'lucide-react';
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
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

export function CleanerSidebar() {
  const { user, signOut, cleanerId } = useAuth();
  const location = useLocation();
  const { open } = useSidebar();

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
      title: "Today's Work",
      url: "/cleaner-today-bookings",
      icon: MapPin,
    },
    {
      title: "Messages",
      url: "/cleaner-messages",
      icon: MessageCircle,
    },
    {
      title: "Available Bookings",
      url: "/cleaner-available-bookings",
      icon: Briefcase,
    },
    {
      title: "Completed Bookings",
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
    <Sidebar className="border-r border-border bg-background" collapsible="icon">
      <SidebarHeader className={`border-b border-border ${open ? "px-4 py-4" : "px-4 py-4"}`}>
        {open && (
          <div className="text-lg font-semibold text-foreground">
            SN Cleaning
          </div>
        )}
        {!open && (
          <div className="text-xl font-bold text-primary text-center">
            SN
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent className={open ? "px-4 py-3" : "px-4 py-3"}>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location.pathname === item.url}
                    className={`w-full transition-all duration-200 ${
                      open ? "h-12 px-3 py-3 justify-start" : "h-12 px-3 py-3 justify-center"
                    }`}
                  >
                    <Link to={item.url} className="flex items-center">
                      <item.icon className={`flex-shrink-0 ${open ? "h-6 w-6" : "h-7 w-7"}`} />
                      {open && (
                        <span className="ml-4 font-medium truncate text-base">{item.title}</span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={`border-t border-border ${open ? "px-4 py-4" : "px-4 py-4"}`}>
        <SidebarMenu className="space-y-3">
          <SidebarMenuItem>
            <SidebarMenuButton 
              className={`h-auto transition-all duration-200 ${
                open ? "justify-start px-3 py-3" : "justify-center px-2 py-3"
              }`}
            >
              <User className={`flex-shrink-0 ${open ? "h-5 w-5" : "h-6 w-6"}`} />
              {open && (
                <div className="ml-3 flex flex-col items-start min-w-0">
                  <span className="text-sm text-muted-foreground truncate w-full">
                    {user?.email}
                  </span>
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
          {open && (
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
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
