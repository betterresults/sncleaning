import { Briefcase, Calendar, History, DollarSign, MapPin, MessageCircle, Settings, Plus, Users, Home, BarChart3, Calculator, Repeat, CreditCard, Shield, UserCheck, UserPlus, Package, TrendingUp, Activity, Bell, CheckSquare, TestTube } from 'lucide-react';

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
      icon: Users,
      subItems: [
        {
          title: "All Users",
          url: "/users",
          icon: Users,
        },
        {
          title: "Admins",
          url: "/users/admins",
          icon: Shield,
        },
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
    title: "Payments",
    icon: CreditCard,
    subItems: [
      {
        title: "Stripe Dashboard",
        url: "/admin-stripe-payments",
        icon: CreditCard,
      },
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
    title: "Activity Logs",
    url: "/admin-activity-logs",
    icon: Activity,
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
    ],
  },
  {
    title: "Linen Management",
    url: "/admin-linen-management",
    icon: Package,
  },
  {
    title: "Forms",
    icon: CheckSquare,
    subItems: [
      {
        title: "Airbnb Form Settings",
        url: "/admin-airbnb-form-settings",
        icon: Settings,
      },
    ],
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
        title: "Notification Management",
        url: "/admin-notification-management",
        icon: Bell,
      },
      {
        title: "Invoiless API Test",
        url: "/invoiless-api-test",
        icon: TestTube,
      },
    ],
  },
];