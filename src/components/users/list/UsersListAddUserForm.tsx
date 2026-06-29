import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAddButtonText } from './usersListLabels';
import type { NewUserFormData, UsersTableUserType } from './types';

interface UsersListAddUserFormProps {
  userType: UsersTableUserType;
  newUserData: NewUserFormData;
  onNewUserDataChange: (data: NewUserFormData) => void;
  addingUser: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export function UsersListAddUserForm({
  userType,
  newUserData,
  onNewUserDataChange,
  addingUser,
  onSubmit,
  onCancel,
}: UsersListAddUserFormProps) {
  const addButtonText = getAddButtonText(userType);

  return (
    <div className="flex flex-col gap-2.5 py-2.5">
      <p className="text-sm font-semibold tracking-tight text-foreground">{addButtonText}</p>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="firstName" className="text-xs font-medium text-muted-foreground">
            First name
          </Label>
          <Input
            id="firstName"
            value={newUserData.first_name}
            onChange={(e) => onNewUserDataChange({ ...newUserData, first_name: e.target.value })}
            placeholder="First name"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="lastName" className="text-xs font-medium text-muted-foreground">
            Last name
          </Label>
          <Input
            id="lastName"
            value={newUserData.last_name}
            onChange={(e) => onNewUserDataChange({ ...newUserData, last_name: e.target.value })}
            placeholder="Last name"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={newUserData.email}
            onChange={(e) => onNewUserDataChange({ ...newUserData, email: e.target.value })}
            placeholder="Email address"
          />
        </div>
        {userType === 'cleaner' && (
          <div className="flex flex-col gap-1">
            <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground">
              Phone
            </Label>
            <Input
              id="phone"
              type="tel"
              value={newUserData.phone}
              onChange={(e) => onNewUserDataChange({ ...newUserData, phone: e.target.value })}
              placeholder="Phone number"
            />
          </div>
        )}
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
        A temporary password will be emailed automatically
      </p>
      {(userType === 'all' || userType === 'office') && (
        <div className="flex max-w-xs flex-col gap-1">
          <Label htmlFor="role" className="text-xs font-medium text-muted-foreground">
            Role
          </Label>
          <Select
            value={newUserData.role}
            onValueChange={(value) => onNewUserDataChange({ ...newUserData, role: value })}
          >
            <SelectTrigger id="role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {userType === 'office' ? (
                <>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="sales_agent">Sales Agent</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="guest">Customer</SelectItem>
                  <SelectItem value="user">Cleaner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={onSubmit} disabled={addingUser}>
          {addingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {addButtonText}
        </Button>
      </div>
    </div>
  );
}
