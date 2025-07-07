
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Plus, Edit, Trash2, Save, X } from 'lucide-react';
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

interface Address {
  id: string;
  address: string;
  postcode: string;
  is_default: boolean;
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

  useEffect(() => {
    if (activeCustomerId) {
      fetchAddresses();
    }
  }, [activeCustomerId]);

  const fetchAddresses = async () => {
    if (!activeCustomerId) return;

    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('customer_id', activeCustomerId)
        .order('is_default', { ascending: false });

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Addresses
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Address
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Address</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
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
    <div className="border rounded-lg p-4 space-y-3">
      {address.is_default && (
        <div className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
          Default Address
        </div>
      )}
      
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <Label htmlFor={`edit-address-${address.id}`}>Address</Label>
            <Input
              id={`edit-address-${address.id}`}
              value={editData.address}
              onChange={(e) => setEditData({ ...editData, address: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor={`edit-postcode-${address.id}`}>Postcode</Label>
            <Input
              id={`edit-postcode-${address.id}`}
              value={editData.postcode}
              onChange={(e) => setEditData({ ...editData, postcode: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <p className="font-medium">{address.address}</p>
          <p className="text-sm text-muted-foreground">{address.postcode}</p>
          <div className="flex justify-end space-x-2 mt-3">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={onDelete} disabled={loading}>
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
