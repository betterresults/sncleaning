import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, X } from 'lucide-react';
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
    <div className="mt-4 p-4 border rounded-lg bg-muted/30 space-y-4">
      <h3 className="font-medium">{addButtonText}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={newUserData.first_name}
            onChange={(e) => onNewUserDataChange({ ...newUserData, first_name: e.target.value })}
            placeholder="Enter first name"
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={newUserData.last_name}
            onChange={(e) => onNewUserDataChange({ ...newUserData, last_name: e.target.value })}
            placeholder="Enter last name"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={newUserData.email}
            onChange={(e) => onNewUserDataChange({ ...newUserData, email: e.target.value })}
            placeholder="Enter email address"
          />
        </div>
        {userType === 'cleaner' && (
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={newUserData.phone}
              onChange={(e) => onNewUserDataChange({ ...newUserData, phone: e.target.value })}
              placeholder="Enter phone number"
            />
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Mail className="h-4 w-4" />
          A temporary password will be auto-generated and sent via email
        </p>
      </div>
      {(userType === 'all' || userType === 'office') && (
        <div className="max-w-xs">
          <Label htmlFor="role">Role *</Label>
          <Select
            value={newUserData.role}
            onValueChange={(value) => onNewUserDataChange({ ...newUserData, role: value })}
          >
            <SelectTrigger>
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
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={addingUser}>
          {addingUser ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {addButtonText}
        </Button>
      </div>
    </div>
  );
}
