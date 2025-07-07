
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, LayoutDashboard, User, History, Eye, MessageCircle, Calculator } from 'lucide-react';
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
import CreateNewBookingDialog from '@/components/booking/CreateNewBookingDialog';

export function AppSidebar() {
  const { user, userRole, signOut } = useAuth();
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
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Completed Bookings",
      url: "/past-bookings",
      icon: History,
    },
    {
      title: "Bookings",
      url: "/admin",
      icon: Calendar,
      adminOnly: true,
    },
    {
      title: "Chat Management",
      url: "/admin-chat-management",
      icon: MessageCircle,
      adminOnly: true,
    },
    {
      title: "Pricing Formulas",
      url: "/admin-pricing-formulas",
      icon: Calculator,
      adminOnly: true,
    },
    {
      title: "Users",
      url: "/users",
      icon: Users,
      adminOnly: true,
    },
  ];

  const filteredItems = menuItems.filter(item => 
    !item.adminOnly || (item.adminOnly && userRole === 'admin')
  );

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <CreateNewBookingDialog />
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location.pathname === item.url}
                  >
                    <Link to={item.url}>
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

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <div className="flex items-center">
                <User className="h-4 w-4" />
                <span className="truncate">{user?.email}</span>
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
