import { Calendar, History, DollarSign, Briefcase, MapPin, MessageCircle, Settings, Plus, Users, Home, BarChart3, Calculator, Repeat, CreditCard } from 'lucide-react';

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
    url: "#",
    icon: MessageCircle,
    disabled: true,
    subtitle: "Coming Soon"
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
  {
    title: "Settings",
    url: "/cleaner-settings",
    icon: Settings,
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
    title: "Completed Bookings",
    url: "/customer-completed-bookings",
    icon: Calendar,
  },
  {
    title: "Messages",
    url: "#",
    icon: MessageCircle,
    disabled: true,
    subtitle: "Coming Soon"
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
    title: "Bookings",
    icon: Calendar,
    subItems: [
      {
        title: "Add New Booking",
        url: "/admin-add-booking",
        icon: Plus,
      },
      {
        title: "Upcoming Bookings",
        url: "/dashboard",
        icon: BarChart3,
      },
      {
        title: "Completed Bookings",
        url: "/past-bookings",
        icon: History,
      },
      {
        title: "Recurring Bookings",
        url: "/recurring-bookings",
        icon: Repeat,
      },
    ],
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
    title: "Pricing Formulas",
    url: "/admin-pricing-formulas",
    icon: Calculator,
  },
  {
    title: "Payments",
    icon: CreditCard,
    subItems: [
      {
        title: "Cleaner Payments",
        url: "/admin-cleaner-payments",
        icon: DollarSign,
      },
      {
        title: "Customer Payments",
        url: "/admin-customer-payments",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "Chat Management",
    url: "/admin-chat-management",
    icon: MessageCircle,
  },
  {
    title: "Settings",
    url: "/admin-settings",
    icon: Settings,
  },
];