
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, History, DollarSign, User } from 'lucide-react';
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
      description: "View upcoming bookings"
    },
    {
      title: "Past Bookings",
      url: "/cleaner-past-bookings",
      icon: History,
      description: "View completed bookings"
    },
    {
      title: "My Earnings",
      url: "/cleaner-earnings",
      icon: DollarSign,
      description: "View earnings and payments"
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-primary">Cleaner Portal</h2>
          <p className="text-sm text-muted-foreground">
            Cleaner ID: {cleanerId}
          </p>
        </div>
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
                  >
                    <Link to={item.url} className="w-full">
                      <item.icon className="h-4 w-4" />
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{item.title}</span>
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      </div>
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
                  <span className="text-sm font-medium">Signed in as:</span>
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
