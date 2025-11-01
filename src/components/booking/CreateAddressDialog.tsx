import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Address {
  id: string;
  customer_id: number;
  address: string;
  postcode: string;
  access?: string;
  deatails?: string;
  is_default?: boolean;
}

interface CreateAddressDialogProps {
  customerId: number;
  onAddressCreated: (address: Address) => void;
  children?: React.ReactNode;
}

const CreateAddressDialog = ({ customerId, onAddressCreated, children }: CreateAddressDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    address: '',
    postcode: '',
    access: '',
    deatails: '',
    isDefault: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.address || !formData.postcode) {
      toast({
        title: "Missing Information",
        description: "Please provide address and postcode",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // If setting as default, unset other defaults first
      if (formData.isDefault) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('customer_id', customerId);
      }

      const { data, error } = await supabase
        .from('addresses')
        .insert({
          customer_id: customerId,
          address: formData.address,
          postcode: formData.postcode,
          access: formData.access || null,
          deatails: formData.deatails || null,
          is_default: formData.isDefault,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Address created successfully"
      });

      onAddressCreated(data);
      setOpen(false);
      
      // Reset form
      setFormData({
        address: '',
        postcode: '',
        access: '',
        deatails: '',
        isDefault: false,
      });
    } catch (error: any) {
      console.error('Error creating address:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create address",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Address</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main Street"
              required
            />
          </div>

          <div>
            <Label htmlFor="postcode">Postcode *</Label>
            <Input
              id="postcode"
              value={formData.postcode}
              onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
              placeholder="SW1A 1AA"
              required
            />
          </div>

          <div>
            <Label htmlFor="deatails">Label / Details</Label>
            <Input
              id="deatails"
              value={formData.deatails}
              onChange={(e) => setFormData({ ...formData, deatails: e.target.value })}
              placeholder="e.g., Office, Parent's house"
            />
          </div>

          <div>
            <Label htmlFor="access">Access Instructions</Label>
            <Textarea
              id="access"
              value={formData.access}
              onChange={(e) => setFormData({ ...formData, access: e.target.value })}
              placeholder="How to access the property..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDefault"
              checked={formData.isDefault}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, isDefault: checked as boolean })
              }
            />
            <Label htmlFor="isDefault" className="cursor-pointer">
              Set as default address
            </Label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Address
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAddressDialog;
