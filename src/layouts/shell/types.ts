import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface ShellNavigationSubItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export interface ShellNavigationItem {
  title: string;
  url?: string;
  icon: LucideIcon;
  disabled?: boolean;
  subtitle?: string;
  subItems?: ShellNavigationSubItem[];
  showCount?: boolean;
  countKey?: string;
}

export interface ShellUser {
  email?: string;
  user_metadata?: { first_name?: string };
}

export interface AppShellProps {
  navigationItems: ShellNavigationItem[];
  user: ShellUser | null;
  userRole?: string;
  customerId?: number | null;
  cleanerId?: number | null;
  title?: string;
  showBackToAdmin?: boolean;
  onSignOut: () => void;
  children: ReactNode;
}
