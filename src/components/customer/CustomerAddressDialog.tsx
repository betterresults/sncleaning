import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface Address {
  id: string;
  address: string;
  postcode: string;
  is_default: boolean;
}

interface CustomerAddressDialogProps {
  customerId: number;
  addressCount: number;
  onAddressChange: () => void;
  children?: React.ReactNode;
}

const CustomerAddressDialog = ({ customerId, addressCount, onAddressChange, children }: CustomerAddressDialogProps) => {
  const [open, setOpen] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [newAddress, setNewAddress] = useState({ address: '', postcode: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAddresses = async () => {
    if (!customerId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('customer_id', customerId)
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && customerId) {
      fetchAddresses();
    }
  }, [open, customerId]);

  const handleAddAddress = async () => {
    if (!newAddress.address || !newAddress.postcode) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('addresses')
        .insert({
          customer_id: customerId,
          address: newAddress.address,
          postcode: newAddress.postcode,
          is_default: addresses.length === 0
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Address added successfully'
      });

      setNewAddress({ address: '', postcode: '' });
      fetchAddresses();
      onAddressChange();
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
      onAddressChange();
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
      onAddressChange();
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <MapPin className="h-4 w-4 mr-2" />
            {addressCount} Address{addressCount !== 1 ? 'es' : ''}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Manage Customer Addresses
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add New Address */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Address
            </h3>
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="flex justify-end">
              <Button onClick={handleAddAddress} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                Add Address
              </Button>
            </div>
          </div>

          {/* Existing Addresses */}
          <div className="space-y-4">
            <h3 className="font-medium">Existing Addresses ({addresses.length})</h3>
            {addresses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No addresses found.</p>
                <p className="text-sm">Add the first address above.</p>
              </div>
            ) : (
              <div className="space-y-3">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
        <Badge variant="secondary" className="text-xs">
          Default Address
        </Badge>
      )}
      
      {isEditing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
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
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={loading}>
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
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={onDelete} disabled={loading}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerAddressDialog;
