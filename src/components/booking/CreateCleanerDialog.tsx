
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateCleanerDialogProps {
  children: React.ReactNode;
  onCleanerCreated: (cleaner: any) => void;
}

const CreateCleanerDialog = ({ children, onCleanerCreated }: CreateCleanerDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postcode: '',
    hourlyRate: '20',
    percentageRate: '70',
    services: '',
    dbsDate: '',
    dbsStatus: 'No'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanerData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone ? parseInt(formData.phone) : null,
        address: formData.address,
        postcode: formData.postcode,
        hourly_rate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : 20,
        presentage_rate: formData.percentageRate ? parseFloat(formData.percentageRate) : 70,
        services: formData.services,
        DBS_date: formData.dbsDate || null,
        DBS: formData.dbsStatus,
        rating: 0,
        reviews: 0,
        years: 0,
        cleans_number: 0
      };

      const { data, error } = await supabase
        .from('cleaners')
        .insert([cleanerData])
        .select()
        .single();

      if (error) {
        console.error('Error creating cleaner:', error);
        toast({
          title: "Error",
          description: "Failed to create cleaner. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Cleaner created successfully!",
      });

      onCleanerCreated(data);
      setOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        postcode: '',
        hourlyRate: '20',
        percentageRate: '70',
        services: '',
        dbsDate: '',
        dbsStatus: 'No'
      });
    } catch (error) {
      console.error('Error creating cleaner:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Cleaner</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postcode">Postcode</Label>
              <Input
                id="postcode"
                value={formData.postcode}
                onChange={(e) => handleInputChange('postcode', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="hourlyRate">Hourly Rate (£) *</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                value={formData.hourlyRate}
                onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                placeholder="20.00"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="percentageRate">Percentage Rate (%) *</Label>
            <Input
              id="percentageRate"
              type="number"
              step="1"
              min="0"
              max="100"
              value={formData.percentageRate}
              onChange={(e) => handleInputChange('percentageRate', e.target.value)}
              placeholder="70"
              required
            />
            <p className="text-sm text-gray-500 mt-1">Percentage of booking total cost that cleaner receives</p>
          </div>

          <div>
            <Label htmlFor="services">Services Offered</Label>
            <Textarea
              id="services"
              value={formData.services}
              onChange={(e) => handleInputChange('services', e.target.value)}
              placeholder="Regular cleaning, deep cleaning, end of tenancy..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dbsDate">DBS Check Date</Label>
              <Input
                id="dbsDate"
                type="date"
                value={formData.dbsDate}
                onChange={(e) => handleInputChange('dbsDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dbsStatus">DBS Status</Label>
              <select
                id="dbsStatus"
                value={formData.dbsStatus}
                onChange={(e) => handleInputChange('dbsStatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Cleaner'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCleanerDialog;
