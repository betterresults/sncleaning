import { Calendar, History, DollarSign, Briefcase, MapPin, MessageCircle, Settings, Plus, Users, Home, BarChart3, Calculator } from 'lucide-react';

export const cleanerNavigation = [
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

export const customerNavigation = [
  {
    title: "Dashboard",
    url: "/customer-dashboard",
    icon: Home,
  },
  {
    title: "Add Booking",
    url: "/customer-add-booking",
    icon: Plus,
  },
  {
    title: "My Bookings",
    url: "/customer-completed-bookings",
    icon: Calendar,
  },
  {
    title: "Messages",
    url: "/customer-messages",
    icon: MessageCircle,
  },
  {
    title: "Settings",
    url: "/customer-settings",
    icon: Settings,
  },
];

export const adminNavigation = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Past Bookings",
    url: "/past-bookings",
    icon: History,
  },
  {
    title: "Users",
    url: "/users",
    icon: Users,
  },
  {
    title: "Create Accounts",
    url: "/create-customer-accounts",
    icon: Plus,
  },
  {
    title: "Admin Dashboard",
    url: "/admin-dashboard",
    icon: BarChart3,
  },
  {
    title: "Pricing Formulas",
    url: "/admin-pricing-formulas",
    icon: Calculator,
  },
  {
    title: "Chat Management",
    url: "/admin-chat-management",
    icon: MessageCircle,
  },
];