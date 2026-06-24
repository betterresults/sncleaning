import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Edit2,
  Save,
  X as Cancel,
  Loader2,
} from 'lucide-react';
import type { CustomerDetailOverviewTabProps } from './types';

export function CustomerDetailOverviewTab({
  customer,
  paymentMethodsCount,
  upcomingBookingsCount,
  pastBookingsCount,
  addressesCount,
  totalUnpaid,
  onSave,
}: CustomerDetailOverviewTabProps) {
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState<Partial<typeof customer>>({});
  const [updatingCustomer, setUpdatingCustomer] = useState(false);

  const startEditingCustomer = () => {
    setEditCustomerData({
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      company: customer.company || '',
      client_status: customer.client_status || 'New',
    });
    setEditingCustomer(true);
  };

  const cancelEditingCustomer = () => {
    setEditingCustomer(false);
    setEditCustomerData({});
  };

  const saveCustomerData = async () => {
    setUpdatingCustomer(true);
    try {
      await onSave(editCustomerData);
      setEditingCustomer(false);
      setEditCustomerData({});
    } finally {
      setUpdatingCustomer(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </div>
            {!editingCustomer ? (
              <Button size="sm" variant="outline" onClick={startEditingCustomer}>
                <Edit2 className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={saveCustomerData}
                  disabled={updatingCustomer}
                >
                  {updatingCustomer ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelEditingCustomer}>
                  <Cancel className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editingCustomer ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={editCustomerData.first_name || ''}
                  onChange={(e) =>
                    setEditCustomerData((prev) => ({ ...prev, first_name: e.target.value }))
                  }
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={editCustomerData.last_name || ''}
                  onChange={(e) =>
                    setEditCustomerData((prev) => ({ ...prev, last_name: e.target.value }))
                  }
                  placeholder="Enter last name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editCustomerData.email || ''}
                  onChange={(e) =>
                    setEditCustomerData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Enter email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editCustomerData.phone || ''}
                  onChange={(e) =>
                    setEditCustomerData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={editCustomerData.company || ''}
                  onChange={(e) =>
                    setEditCustomerData((prev) => ({ ...prev, company: e.target.value }))
                  }
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_status">Status</Label>
                <Input
                  id="client_status"
                  value={editCustomerData.client_status || ''}
                  onChange={(e) =>
                    setEditCustomerData((prev) => ({ ...prev, client_status: e.target.value }))
                  }
                  placeholder="Client status"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {(customer.first_name || customer.last_name) && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {customer.first_name} {customer.last_name}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">{customer.email}</span>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.company && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.company}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Badge variant="outline">{customer.client_status}</Badge>
                {customer.clent_type && (
                  <Badge variant="secondary">{customer.clent_type}</Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Customer since: {new Date(customer.created_at).toLocaleDateString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Payment Methods:</span>
            <Badge variant={paymentMethodsCount > 0 ? 'default' : 'secondary'}>
              {paymentMethodsCount}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Upcoming Bookings:</span>
            <Badge>{upcomingBookingsCount}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Past Bookings:</span>
            <Badge>{pastBookingsCount}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Outstanding Balance:</span>
            <Badge variant={totalUnpaid > 0 ? 'destructive' : 'default'}>
              £{totalUnpaid.toFixed(2)}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Addresses:</span>
            <Badge>{addressesCount}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
