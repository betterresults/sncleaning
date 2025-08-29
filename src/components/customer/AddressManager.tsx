
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Plus, Edit, Trash2, Save, X, History, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminCustomer } from '@/contexts/AdminCustomerContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Address {
  id: string;
  address: string;
  postcode: string;
  is_default: boolean;
}

interface PastBookingAddress {
  id: string;
  address: string;
  postcode: string;
  date_time: string;
  booking_id: string;
}

const AddressManager = () => {
  const { customerId, userRole } = useAuth();
  const { selectedCustomerId } = useAdminCustomer();
  const { toast } = useToast();
  
  // Use selected customer ID if admin is viewing, otherwise use the logged-in user's customer ID
  const activeCustomerId = userRole === 'admin' ? selectedCustomerId : customerId;
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({ address: '', postcode: '' });
  const [pastBookingAddresses, setPastBookingAddresses] = useState<PastBookingAddress[]>([]);
  const [loadingPastAddresses, setLoadingPastAddresses] = useState(false);

  console.log('AddressManager: Component rendered with:', {
    userRole,
    customerId,
    selectedCustomerId,
    activeCustomerId
  });

  useEffect(() => {
    if (activeCustomerId) {
      fetchAddresses();
    }
  }, [activeCustomerId]);

  useEffect(() => {
    console.log('Dialog open effect triggered:', { isAddDialogOpen, activeCustomerId });
    if (isAddDialogOpen && activeCustomerId) {
      fetchPastBookingAddresses();
    }
  }, [isAddDialogOpen, activeCustomerId]);

  const fetchAddresses = async () => {
    if (!activeCustomerId) {
      console.log('AddressManager: No activeCustomerId');
      return;
    }

    console.log('AddressManager: Fetching addresses for customer ID:', activeCustomerId);
    
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('customer_id', activeCustomerId)
        .order('is_default', { ascending: false });

      console.log('AddressManager: Query result:', { data, error });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load addresses',
        variant: 'destructive'
      });
    }
  };

  const handleAddAddress = async () => {
    if (!activeCustomerId || !newAddress.address || !newAddress.postcode) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('addresses')
        .insert({
          customer_id: activeCustomerId,
          address: newAddress.address,
          postcode: newAddress.postcode,
          is_default: addresses.length === 0 // First address becomes default
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Address added successfully'
      });

      setNewAddress({ address: '', postcode: '' });
      setIsAddDialogOpen(false);
      fetchAddresses();
    } catch (error) {
      console.error('Error adding address:', error);
      toast({
        title: 'Error',
        description: 'Failed to add address',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAddress = async (id: string, updatedData: Partial<Address>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('addresses')
        .update(updatedData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Address updated successfully'
      });

      setEditingId(null);
      fetchAddresses();
    } catch (error) {
      console.error('Error updating address:', error);
      toast({
        title: 'Error',
        description: 'Failed to update address',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Address deleted successfully'
      });

      fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete address',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPastBookingAddresses = async () => {
    console.log('fetchPastBookingAddresses called with activeCustomerId:', activeCustomerId);
    if (!activeCustomerId) {
      console.log('No activeCustomerId, returning early');
      return;
    }

    setLoadingPastAddresses(true);
    console.log('Starting to fetch past booking addresses for customer:', activeCustomerId);
    
    try {
      // Fetch from both bookings and past_bookings tables
      const [bookingsResult, pastBookingsResult] = await Promise.all([
        supabase
          .from('bookings')
          .select('id, address, postcode, date_time')
          .eq('customer', activeCustomerId)
          .not('address', 'is', null)
          .not('address', 'eq', '')
          .not('address', 'eq', 'Unknown')
          .not('postcode', 'is', null)
          .not('postcode', 'eq', '')
          .order('date_time', { ascending: false }),
        
        supabase
          .from('past_bookings')
          .select('id, address, postcode, date_time')
          .eq('customer', activeCustomerId)
          .not('address', 'is', null)
          .not('address', 'eq', '')
          .not('address', 'eq', 'Unknown')
          .not('postcode', 'is', null)
          .not('postcode', 'eq', '')
          .order('date_time', { ascending: false })
      ]);

      console.log('Bookings query result:', bookingsResult);
      console.log('Past bookings query result:', pastBookingsResult);

      if (bookingsResult.error) throw bookingsResult.error;
      if (pastBookingsResult.error) throw pastBookingsResult.error;

      // Combine and deduplicate addresses
      const allAddresses = [
        ...(bookingsResult.data || []).map(booking => ({
          ...booking,
          booking_id: booking.id.toString(),
          id: `booking-${booking.id}`
        })),
        ...(pastBookingsResult.data || []).map(booking => ({
          ...booking,
          booking_id: booking.id.toString(),
          id: `past-${booking.id}`
        }))
      ];

      // Remove duplicates based on address + postcode combination
      const uniqueAddresses = allAddresses.filter((addr, index, self) => 
        index === self.findIndex(a => 
          a.address?.toLowerCase() === addr.address?.toLowerCase() && 
          a.postcode?.toLowerCase() === addr.postcode?.toLowerCase()
        )
      );

      setPastBookingAddresses(uniqueAddresses);
      console.log('Final past booking addresses set:', uniqueAddresses);
    } catch (error) {
      console.error('Error fetching past booking addresses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load past booking addresses',
        variant: 'destructive'
      });
    } finally {
      setLoadingPastAddresses(false);
    }
  };

  const handleImportFromPastBooking = (pastAddress: PastBookingAddress) => {
    setNewAddress({
      address: pastAddress.address,
      postcode: pastAddress.postcode
    });
  };

  return (
    <Card className="border-0">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-[#185166] text-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#18A5A5] rounded-lg border border-white/20 shadow-sm">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            Addresses
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm"
                className="bg-[#18A5A5] hover:bg-[#185166] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Address
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Address</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Loading state for past addresses */}
                {loadingPastAddresses && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 animate-spin" />
                    Looking for addresses from past bookings...
                  </div>
                )}

                {/* Past booking addresses dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="pastAddressSelect">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Select from past booking addresses
                    </div>
                  </Label>
                  <Select onValueChange={(value) => {
                    const selectedAddress = pastBookingAddresses.find(addr => addr.id === value);
                    if (selectedAddress) {
                      handleImportFromPastBooking(selectedAddress);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        loadingPastAddresses 
                          ? "Loading past addresses..." 
                          : pastBookingAddresses.length === 0 
                            ? "No addresses found in past bookings" 
                            : `Choose from ${pastBookingAddresses.length} past address${pastBookingAddresses.length > 1 ? 'es' : ''}`
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {pastBookingAddresses.map((pastAddr) => (
                        <SelectItem key={pastAddr.id} value={pastAddr.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{pastAddr.address}</span>
                            <span className="text-xs text-muted-foreground">{pastAddr.postcode}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Manual address input */}
                <div>
                  <Label htmlFor="newAddress">Address</Label>
                  <Input
                    id="newAddress"
                    value={newAddress.address}
                    onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                    placeholder="Enter full address"
                  />
                </div>
                <div>
                  <Label htmlFor="newPostcode">Postcode</Label>
                  <Input
                    id="newPostcode"
                    value={newAddress.postcode}
                    onChange={(e) => setNewAddress({ ...newAddress, postcode: e.target.value })}
                    placeholder="Enter postcode"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddAddress} disabled={loading}>
                    Add Address
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {addresses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No addresses found.</p>
            <p className="text-sm">Add your first address to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                isEditing={editingId === address.id}
                onEdit={() => setEditingId(address.id)}
                onCancel={() => setEditingId(null)}
                onSave={(updatedData) => handleUpdateAddress(address.id, updatedData)}
                onDelete={() => handleDeleteAddress(address.id)}
                loading={loading}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface AddressCardProps {
  address: Address;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (data: Partial<Address>) => void;
  onDelete: () => void;
  loading: boolean;
}

const AddressCard = ({ address, isEditing, onEdit, onCancel, onSave, onDelete, loading }: AddressCardProps) => {
  const [editData, setEditData] = useState({
    address: address.address,
    postcode: address.postcode
  });

  const handleSave = () => {
    onSave(editData);
  };

  const handleCancel = () => {
    setEditData({
      address: address.address,
      postcode: address.postcode
    });
    onCancel();
  };

  return (
    <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-white shadow-sm hover:shadow-md transition-all duration-300">
      {address.is_default && (
        <div className="inline-block bg-[#18A5A5]/10 text-[#18A5A5] text-xs px-2 py-1 rounded font-medium">
          Default Address
        </div>
      )}
      
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <Label htmlFor={`edit-address-${address.id}`} className="text-sm font-medium text-[#185166]">Address</Label>
            <Input
              id={`edit-address-${address.id}`}
              value={editData.address}
              onChange={(e) => setEditData({ ...editData, address: e.target.value })}
              className="border-gray-200 focus:border-[#18A5A5] focus:ring-[#18A5A5]/20 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor={`edit-postcode-${address.id}`} className="text-sm font-medium text-[#185166]">Postcode</Label>
            <Input
              id={`edit-postcode-${address.id}`}
              value={editData.postcode}
              onChange={(e) => setEditData({ ...editData, postcode: e.target.value })}
              className="border-gray-200 focus:border-[#18A5A5] focus:ring-[#18A5A5]/20 rounded-xl"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCancel}
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={loading}
              className="bg-[#18A5A5] hover:bg-[#185166] text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <p className="font-medium text-[#185166]">{address.address}</p>
          <p className="text-sm text-muted-foreground">{address.postcode}</p>
          <div className="flex justify-end space-x-2 mt-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEdit}
              className="border-[#18A5A5] text-[#18A5A5] hover:bg-[#18A5A5] hover:text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onDelete} 
              disabled={loading}
              className="border-gray-300 text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressManager;
