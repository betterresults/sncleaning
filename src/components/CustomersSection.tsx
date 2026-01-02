import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Search } from 'lucide-react';
import { CustomerAccountActions } from '@/components/admin/CustomerAccountActions';
import PaymentMethodStatusIcon from '@/components/customer/PaymentMethodStatusBadge';
import { CollectPaymentMethodDialog } from '@/components/payments/CollectPaymentMethodDialog';
import { useCustomerPaymentMethods } from '@/hooks/useCustomerPaymentMethods';
import { formatPhoneToInternational } from '@/utils/phoneFormatter';
import { DeleteCustomerDialog } from '@/components/admin/DeleteCustomerDialog';

interface CustomerData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address?: string;
  postcode?: string;
  client_status: string;
  full_name: string;
  source?: string;
  booking_count?: number;
  upcoming_bookings?: number;
}

interface CustomersSectionProps {
  hideCreateButton?: boolean;
  showCreateForm?: boolean;
  onCreateSuccess?: () => void;
  readOnly?: boolean;
}

const CustomersSection = ({ hideCreateButton, showCreateForm, onCreateSuccess, readOnly = false }: CustomersSectionProps) => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<number | null>(null);
  const [editCustomerData, setEditCustomerData] = useState<Partial<CustomerData>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<CustomerData | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postcode: '',
    source: ''
  });
  const { toast } = useToast();
  const { paymentData, loading: paymentDataLoading } = useCustomerPaymentMethods(customers.map(c => c.id));

  const fetchCustomers = async () => {
    try {
      console.log('Fetching customers...');
      
      // Fetch customers with booking counts using separate queries
      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .order('id', { ascending: false });
      
      if (error) throw error;

      // Get booking counts for each customer
      const processedCustomers = await Promise.all(
        customers?.map(async (customer) => {
          const [{ count: upcomingCount }, { count: pastCount }] = await Promise.all([
            supabase
              .from('bookings')
              .select('*', { count: 'exact', head: true })
              .eq('customer', customer.id),
            supabase
              .from('past_bookings')
              .select('*', { count: 'exact', head: true })
              .eq('customer', customer.id)
          ]);

          return {
            ...customer,
            booking_count: (upcomingCount || 0) + (pastCount || 0),
            upcoming_bookings: upcomingCount || 0
          };
        }) || []
      );

      setCustomers(processedCustomers);
      setFilteredCustomers(processedCustomers);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch customers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async () => {
    try {
      setCreating(true);
      
      const { data, error } = await supabase
        .from('customers')
        .insert({
          first_name: newCustomer.firstName,
          last_name: newCustomer.lastName,
          email: newCustomer.email,
          phone: formatPhoneToInternational(newCustomer.phone),
          address: newCustomer.address,
          postcode: newCustomer.postcode,
          source: newCustomer.source || null,
          client_status: 'Current'
        })
        .select();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Customer created successfully!',
      });

      setNewCustomer({ 
        firstName: '', 
        lastName: '', 
        email: '', 
        phone: '', 
        address: '', 
        postcode: '',
        source: ''
      });
      fetchCustomers();
    } catch (error: any) {
      console.error('Error creating customer:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create customer',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const updateCustomer = async (customerId: number) => {
    try {
      const dataToUpdate = {
        ...editCustomerData,
        phone: editCustomerData.phone ? formatPhoneToInternational(editCustomerData.phone) : editCustomerData.phone
      };
      const { error } = await supabase
        .from('customers')
        .update(dataToUpdate)
        .eq('id', customerId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Customer updated successfully!',
      });

      setEditingCustomer(null);
      setEditCustomerData({});
      fetchCustomers();
    } catch (error: any) {
      console.error('Error updating customer:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update customer',
        variant: 'destructive',
      });
    }
  };

  const openDeleteDialog = (customer: CustomerData) => {
    setCustomerToDelete(customer);
    setShowDeleteDialog(true);
  };

  const startEditingCustomer = (customer: CustomerData) => {
    setEditingCustomer(customer.id);
    setEditCustomerData({
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      postcode: customer.postcode,
      client_status: customer.client_status,
      source: customer.source
    });
  };

  const cancelEditing = () => {
    setEditingCustomer(null);
    setEditCustomerData({});
  };

  const handleCreateCustomerClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Create customer button clicked');
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer => 
        customer.first_name?.toLowerCase().includes(term.toLowerCase()) ||
        customer.last_name?.toLowerCase().includes(term.toLowerCase()) ||
        customer.email?.toLowerCase().includes(term.toLowerCase()) ||
        customer.phone?.includes(term) ||
        customer.id.toString().includes(term)
      );
      setFilteredCustomers(filtered);
    }
  };

  const getCustomerBadge = (customer: CustomerData) => {
    if (!customer.booking_count || customer.booking_count === 0) {
      return <Badge variant="secondary" className="text-xs bg-green-100 text-green-600">New</Badge>;
    }
    return null; // No badge for existing customers
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    handleSearch(searchTerm);
  }, [customers]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h3 className="text-base sm:text-lg font-semibold">Customers ({filteredCustomers.length})</h3>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search customers by name, email, phone, or ID..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Create Customer Form - Mobile Responsive */}
      {showCreateForm && (
        <div className="p-3 sm:p-4 border rounded-lg bg-gray-50">
          <h4 className="font-semibold mb-4 text-sm sm:text-base">Create New Customer</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
            <div>
              <Label htmlFor="customerFirstName" className="text-sm">First Name</Label>
              <Input
                id="customerFirstName"
                value={newCustomer.firstName}
                onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="customerLastName" className="text-sm">Last Name</Label>
              <Input
                id="customerLastName"
                value={newCustomer.lastName}
                onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
            <div>
              <Label htmlFor="customerEmail" className="text-sm">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="customerPhone" className="text-sm">Phone</Label>
              <Input
                id="customerPhone"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
            <div>
              <Label htmlFor="customerAddress" className="text-sm">Address</Label>
              <Input
                id="customerAddress"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="customerPostcode" className="text-sm">Postcode</Label>
              <Input
                id="customerPostcode"
                value={newCustomer.postcode}
                onChange={(e) => setNewCustomer({ ...newCustomer, postcode: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
            <div>
              <Label htmlFor="customerSource" className="text-sm">Source</Label>
              <Input
                id="customerSource"
                placeholder="e.g. Facebook ads, Organic, Referral"
                value={newCustomer.source}
                onChange={(e) => setNewCustomer({ ...newCustomer, source: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>
          <Button
            onClick={async () => {
              await createCustomer();
              if (onCreateSuccess) onCreateSuccess();
            }}
            disabled={creating}
            className="bg-blue-900 hover:bg-blue-800 text-white text-sm w-full sm:w-auto"
            size="sm"
          >
            {creating ? 'Creating...' : 'Create Customer'}
          </Button>
        </div>
      )}

      {/* Customers List - Mobile Responsive */}
      <div>
        {loading ? (
          <div className="text-center py-8">Loading customers...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No customers found matching your search.' : 'No customers found.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="p-3 sm:p-4 border rounded-lg">
                {editingCustomer === customer.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <Input
                          placeholder="First Name"
                          value={editCustomerData.first_name || ''}
                          onChange={(e) => setEditCustomerData({ ...editCustomerData, first_name: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Last Name"
                          value={editCustomerData.last_name || ''}
                          onChange={(e) => setEditCustomerData({ ...editCustomerData, last_name: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Email"
                          value={editCustomerData.email || ''}
                          onChange={(e) => setEditCustomerData({ ...editCustomerData, email: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Phone"
                          value={editCustomerData.phone || ''}
                          onChange={(e) => setEditCustomerData({ ...editCustomerData, phone: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Address"
                          value={editCustomerData.address || ''}
                          onChange={(e) => setEditCustomerData({ ...editCustomerData, address: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Postcode"
                          value={editCustomerData.postcode || ''}
                          onChange={(e) => setEditCustomerData({ ...editCustomerData, postcode: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Source (e.g. Facebook ads)"
                          value={editCustomerData.source || ''}
                          onChange={(e) => setEditCustomerData({ ...editCustomerData, source: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        onClick={() => updateCustomer(customer.id)}
                        size="sm"
                        className="text-sm w-full sm:w-auto"
                      >
                        Save
                      </Button>
                      <Button 
                        onClick={cancelEditing}
                        variant="outline"
                        size="sm"
                        className="text-sm w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 font-medium text-sm sm:text-base mb-1">
                          <span>{customer.first_name} {customer.last_name}</span>
                          {getCustomerBadge(customer)}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 break-all">{customer.email}</div>
                        <div className="text-xs sm:text-sm text-gray-500">{customer.phone}</div>
                        <div className="text-xs text-gray-400">
                          {customer.address}, {customer.postcode}
                        </div>
                        <div className="text-xs text-gray-400">
                          ID: {customer.id} • Bookings: {customer.booking_count || 0}
                          {customer.source && <> • Source: {customer.source}</>}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2 lg:items-end">
                      <CustomerAccountActions 
                        customer={customer}
                        onAccountCreated={fetchCustomers}
                        readOnly={readOnly}
                      />
                      {!readOnly && (
                        <div className="flex gap-2">
                          <PaymentMethodStatusIcon
                            paymentMethodCount={paymentData[customer.id]?.payment_method_count || 0}
                            hasStripeAccount={paymentData[customer.id]?.has_stripe_account || false}
                            onClick={() => {
                              setSelectedCustomerForPayment(customer);
                              setShowPaymentDialog(true);
                            }}
                          />
                          <Button
                            onClick={() => startEditingCustomer(customer)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-xs flex-1 sm:flex-none"
                          >
                            <Edit className="h-3 w-3" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          <Button
                            onClick={() => openDeleteDialog(customer)}
                            variant="destructive"
                            size="sm"
                            className="flex items-center gap-1 text-xs flex-1 sm:flex-none"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Payment Method Dialog */}
      {selectedCustomerForPayment && (
        <CollectPaymentMethodDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          customer={selectedCustomerForPayment}
          onPaymentMethodsUpdated={fetchCustomers}
        />
      )}

      <DeleteCustomerDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        customer={customerToDelete}
        onDeleted={fetchCustomers}
      />
    </div>
  );
};

export default CustomersSection;