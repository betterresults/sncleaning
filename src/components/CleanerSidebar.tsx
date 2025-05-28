
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
    <Sidebar>
      <SidebarHeader className="p-6">
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location.pathname === item.url}
                    size="lg"
                  >
                    <Link to={item.url} className="w-full">
                      <item.icon className="h-6 w-6" />
                      <span className="text-base font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <div className="flex flex-col items-start">
                  <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Button 
              onClick={handleSignOut} 
              variant="outline" 
              size="sm" 
              className="w-full"
            >
              Sign Out
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
