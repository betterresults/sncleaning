import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Plus, Edit, Trash2, Star, Copy } from 'lucide-react';
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

  const handleSetAsDefault = async (id: string) => {
    setLoading(true);
    try {
      // First, unset all other addresses as default
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('customer_id', customerId);

      // Then set this address as default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Default address updated successfully'
      });

      fetchAddresses();
      onAddressChange();
    } catch (error) {
      console.error('Error setting default address:', error);
      toast({
        title: 'Error',
        description: 'Failed to set default address',
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

  const handleDuplicateAddress = (address: Address) => {
    setNewAddress({
      address: address.address,
      postcode: address.postcode
    });
    toast({
      title: 'Address copied',
      description: 'Address details copied to the form above. Make your changes and click Add Address.',
    });
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
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MapPin className="h-5 w-5 text-primary" />
            Addresses
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add New Address - Top Section */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newAddress" className="text-sm font-medium">Address *</Label>
                <Input
                  id="newAddress"
                  value={newAddress.address}
                  onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                  placeholder="Enter full address"
                  className="border-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <Label htmlFor="newPostcode" className="text-sm font-medium">Postcode *</Label>
                <Input
                  id="newPostcode"
                  value={newAddress.postcode}
                  onChange={(e) => setNewAddress({ ...newAddress, postcode: e.target.value })}
                  placeholder="Enter postcode"
                  className="border-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={handleAddAddress} 
                disabled={loading}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Address
              </Button>
            </div>
          </div>

          {/* Existing Addresses */}
          <div className="space-y-4">
            {addresses.length > 0 && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium text-muted-foreground">Addresses ({addresses.length})</h3>
              </div>
            )}
            {addresses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No addresses yet</p>
                <p className="text-sm">Add your first address above to get started.</p>
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
                    onSetAsDefault={() => handleSetAsDefault(address.id)}
                    onDelete={() => handleDeleteAddress(address.id)}
                    onDuplicate={() => handleDuplicateAddress(address)}
                    loading={loading}
                    isOnlyAddress={addresses.length === 1}
                    hasMultipleAddresses={addresses.length > 1}
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
  onSetAsDefault: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  loading: boolean;
  isOnlyAddress: boolean;
  hasMultipleAddresses: boolean;
}

const AddressCard = ({ address, isEditing, onEdit, onCancel, onSave, onSetAsDefault, onDelete, onDuplicate, loading, isOnlyAddress, hasMultipleAddresses }: AddressCardProps) => {
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
    <div className="border border-border/60 rounded-lg p-4 space-y-3 bg-card hover:shadow-sm transition-shadow">
      {address.is_default && !isOnlyAddress && (
        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
          Default
        </Badge>
      )}
      
      {isEditing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`edit-address-${address.id}`} className="text-sm font-medium">Address</Label>
              <Input
                id={`edit-address-${address.id}`}
                value={editData.address}
                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                className="border-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <Label htmlFor={`edit-postcode-${address.id}`} className="text-sm font-medium">Postcode</Label>
              <Input
                id={`edit-postcode-${address.id}`}
                value={editData.postcode}
                onChange={(e) => setEditData({ ...editData, postcode: e.target.value })}
                className="border-primary/20 focus:border-primary"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <p className="font-medium text-foreground">{address.address}</p>
          <p className="text-sm text-muted-foreground">{address.postcode}</p>
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-2">
              {hasMultipleAddresses && !address.is_default && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onSetAsDefault}
                  className="hover:border-primary hover:text-primary"
                >
                  <Star className="h-4 w-4 mr-1" />
                  Set Default
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onDuplicate} 
                className="hover:border-primary hover:text-primary"
                title="Duplicate this address"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={onEdit} className="hover:border-primary hover:text-primary">
                <Edit className="h-4 w-4" />
              </Button>
              {!isOnlyAddress && (
                <Button variant="outline" size="sm" onClick={onDelete} disabled={loading} className="hover:border-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerAddressDialog;
