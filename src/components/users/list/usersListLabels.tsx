import { Badge } from '@/components/ui/badge';
import { Shield, UserCheck, Users } from 'lucide-react';
import type { UserData, UsersTableUserType } from './types';

export function RoleBadge({ role }: { role: string }) {
  switch (role) {
    case 'admin':
      return (
        <Badge variant="destructive" className="gap-1">
          <Shield className="h-3 w-3" />
          Admin
        </Badge>
      );
    case 'sales_agent':
      return (
        <Badge variant="default" className="gap-1 bg-blue-600">
          <UserCheck className="h-3 w-3" />
          Sales Agent
        </Badge>
      );
    case 'user':
      return (
        <Badge variant="default" className="gap-1 bg-primary">
          <UserCheck className="h-3 w-3" />
          Cleaner
        </Badge>
      );
    case 'guest':
    case 'customer':
      return (
        <Badge variant="secondary" className="gap-1">
          <Users className="h-3 w-3" />
          Customer
        </Badge>
      );
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

export function CustomerTypeBadge({ user }: { user: UserData }) {
  const t = user.client_type?.toLowerCase();
  if (t === 'business') {
    return <Badge variant="secondary" className="gap-1">Business</Badge>;
  }
  if (t === 'client') {
    return <Badge variant="default" className="gap-1">Client</Badge>;
  }
  return <Badge variant="outline">—</Badge>;
}

export function getTypeTitle(userType: UsersTableUserType): string {
  switch (userType) {
    case 'admin':
      return 'Admin Users';
    case 'office':
      return 'Office Staff';
    case 'cleaner':
      return 'Cleaner Logins';
    case 'customer':
      return 'Customers';
    default:
      return 'All Users';
  }
}

export function getAddButtonText(userType: UsersTableUserType): string {
  switch (userType) {
    case 'office':
      return 'Add Office Staff';
    case 'customer':
      return 'Add Customer';
    case 'cleaner':
      return 'Add cleaner login';
    case 'admin':
      return 'Add Admin';
    default:
      return 'Add User';
  }
}
