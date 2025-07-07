
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  CheckCircle, 
  Plus, 
  Settings, 
  LogOut,
  User
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const CustomerSidebar = ({ customerId }: { customerId?: number }) => {
  const location = useLocation();
  const { signOut, user } = useAuth();

  const menuItems = [
    {
      title: "My Bookings",
      url: "/customer-dashboard",
      icon: Calendar,
    },
    {
      title: "Completed Bookings",
      url: "/customer-completed-bookings",
      icon: CheckCircle,
    },
    {
      title: "Add New Booking",
      url: "/customer-add-booking",
      icon: Plus,
    },
    {
      title: "Settings",
      url: "/customer-settings",
      icon: Settings,
    },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <User className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-semibold">Customer Portal</span>
        </div>
        {user?.email && (
          <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
        )}
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location.pathname === item.url}
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <Button 
          variant="outline" 
          onClick={handleSignOut}
          className="w-full flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default CustomerSidebar;
