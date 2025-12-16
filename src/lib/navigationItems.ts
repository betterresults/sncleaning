import { Briefcase, Calendar, History, DollarSign, MapPin, MessageCircle, Settings, Plus, Users, Home, BarChart3, Calculator, Repeat, CreditCard, Shield, UserCheck, UserPlus, Package, TrendingUp, Activity, Bell, CheckSquare, TestTube, Shirt, Target } from 'lucide-react';

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
    showCount: true,
    countKey: "available-bookings-count",
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

// Sales Agent Navigation - restricted access (no financial data)
export const salesAgentNavigation = [
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
        url: "/upcoming-bookings",
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
    icon: Users,
    subItems: [
      {
        title: "Cleaners",
        url: "/users/cleaners",
        icon: UserCheck,
      },
      {
        title: "Customers",
        url: "/users/customers",
        icon: UserPlus,
      },
    ],
  },
  {
    title: "Chat Management",
    url: "/admin-chat-management",
    icon: MessageCircle,
  },
  {
    title: "Quote Leads",
    url: "/admin-quote-leads",
    icon: Target,
  },
];

export const getCustomerNavigation = (hasLinenAccess: boolean = false) => [
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
  ...(hasLinenAccess ? [{
    title: "Linen Management",
    url: "/customer-linen-management",
    icon: Package,
  }] : []),
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

export const customerNavigation = getCustomerNavigation();

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
        url: "/upcoming-bookings",
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
    title: "Payments",
    icon: CreditCard,
    subItems: [
      {
        title: "Payment Management",
        url: "/admin-payment-management",
        icon: Settings,
      },
      {
        title: "Profit Tracking",
        url: "/admin-profit-tracking",
        icon: TrendingUp,
      },
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
    title: "Views",
    icon: BarChart3,
    subItems: [
      {
        title: "Cleaner Dashboard",
        url: "/cleaner-dashboard",
        icon: UserCheck,
      },
      {
        title: "Customer Dashboard", 
        url: "/customer-dashboard",
        icon: UserPlus,
      },
      {
        title: "Activity Logs",
        url: "/admin-activity-logs",
        icon: Activity,
      },
      {
        title: "Quote Leads",
        url: "/admin-quote-leads",
        icon: Target,
      },
    ],
  },
  {
    title: "Linen Management",
    url: "/admin-linen-management",
    icon: Package,
  },
  {
    title: "Settings",
    icon: Settings,
    subItems: [
      {
        title: "Company Settings",
        url: "/admin-company-settings",
        icon: Settings,
      },
      {
        title: "Admin Settings",
        url: "/admin-settings",
        icon: Settings,
      },
      {
        title: "Pricing Formulas",
        url: "/admin-pricing-formulas",
        icon: Calculator,
      },
      {
        title: "Customer Pricing",
        url: "/admin-customer-pricing",
        icon: DollarSign,
      },
      {
        title: "Notification Management",
        url: "/admin-notification-management",
        icon: Bell,
      },
      {
        title: "Airbnb Form Settings",
        url: "/admin-airbnb-form-settings",
        icon: CheckSquare,
      },
      {
        title: "Airbnb Booking Form",
        url: "/admin/airbnb",
        icon: Home,
      },
      {
        title: "Linen Order Form",
        url: "/admin/linen",
        icon: Shirt,
      },
      {
        title: "Invoiless API Test",
        url: "/invoiless-api-test",
        icon: TestTube,
      },
    ],
  },
];