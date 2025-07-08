
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
    <Sidebar className="border-r border-border bg-card shadow-lg" collapsible="icon">
      <SidebarHeader className={`border-b border-border bg-primary/5 ${open ? "px-6 py-6" : "px-4 py-6"}`}>
        {open && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">SN</span>
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">SN Cleaning</div>
              <div className="text-xs text-muted-foreground">Services</div>
            </div>
          </div>
        )}
        {!open && (
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <span className="text-primary-foreground font-bold text-xl">SN</span>
            </div>
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent className={open ? "px-4 py-6" : "px-3 py-6"}>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-3">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location.pathname === item.url}
                    className={`transition-all duration-200 hover:bg-primary/10 group ${
                      open 
                        ? "h-14 px-4 py-3 justify-start rounded-xl" 
                        : "h-14 px-3 py-3 justify-center rounded-xl mx-auto w-12"
                    } ${
                      location.pathname === item.url 
                        ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90" 
                        : "hover:shadow-sm"
                    }`}
                  >
                    <Link to={item.url} className="flex items-center w-full">
                      <item.icon className={`flex-shrink-0 transition-all duration-200 ${
                        open ? "h-6 w-6" : "h-7 w-7"
                      } ${
                        location.pathname === item.url 
                          ? "text-primary-foreground" 
                          : "text-foreground group-hover:text-primary"
                      }`} />
                      {open && (
                        <span className={`ml-4 font-semibold truncate transition-colors duration-200 ${
                          location.pathname === item.url 
                            ? "text-primary-foreground" 
                            : "text-foreground group-hover:text-primary"
                        }`}>
                          {item.title}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={`border-t border-border bg-muted/30 ${open ? "px-4 py-6" : "px-3 py-6"}`}>
        <SidebarMenu className="space-y-4">
          <SidebarMenuItem>
            <SidebarMenuButton 
              className={`transition-all duration-200 hover:bg-muted/50 ${
                open ? "justify-start px-4 py-4 rounded-xl" : "justify-center px-3 py-4 rounded-xl mx-auto w-12"
              }`}
            >
              <div className={`w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center flex-shrink-0 ${
                open ? "" : "mx-auto"
              }`}>
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              {open && (
                <div className="ml-3 flex flex-col items-start min-w-0">
                  <span className="text-sm font-medium text-foreground truncate w-full">
                    {user?.user_metadata?.first_name || 'Cleaner'}
                  </span>
                  <span className="text-xs text-muted-foreground truncate w-full">
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
                className="w-full h-11 font-medium border-muted-foreground/20 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive/50 transition-all duration-200"
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
