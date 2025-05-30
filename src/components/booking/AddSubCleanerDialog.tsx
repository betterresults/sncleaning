
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CleanerSelector from './CleanerSelector';

interface AddSubCleanerDialogProps {
  bookingId: number;
  onSubCleanerAdded: () => void;
  children?: React.ReactNode;
}

interface SubCleanerData {
  cleanerId: number | null;
  paymentMethod: 'hourly' | 'percentage';
  hourlyRate: number;
  percentageRate: number;
  hoursAssigned: number;
}

const AddSubCleanerDialog = ({ bookingId, onSubCleanerAdded, children }: AddSubCleanerDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<SubCleanerData>({
    cleanerId: null,
    paymentMethod: 'hourly',
    hourlyRate: 0,
    percentageRate: 70,
    hoursAssigned: 0
  });

  const handleInputChange = (field: keyof SubCleanerData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCleanerSelect = (cleaner: any) => {
    if (cleaner) {
      setFormData(prev => ({
        ...prev,
        cleanerId: cleaner.id,
        hourlyRate: cleaner.hourly_rate || 0,
        percentageRate: cleaner.presentage_rate || 70
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        cleanerId: null
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cleanerId) {
      toast({
        title: "Error",
        description: "Please select a cleaner",
        variant: "destructive",
      });
      return;
    }

    if (formData.hoursAssigned <= 0) {
      toast({
        title: "Error", 
        description: "Please enter valid hours assigned",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const subBookingData = {
        primary_booking_id: bookingId,
        cleaner_id: formData.cleanerId,
        payment_method: formData.paymentMethod,
        hourly_rate: formData.paymentMethod === 'hourly' ? formData.hourlyRate : null,
        percentage_rate: formData.paymentMethod === 'percentage' ? formData.percentageRate : null,
        hours_assigned: formData.hoursAssigned
      };

      const { error } = await supabase
        .from('sub_bookings')
        .insert([subBookingData]);

      if (error) {
        console.error('Error creating sub-booking:', error);
        toast({
          title: "Error",
          description: "Failed to add cleaner to booking",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Additional cleaner added successfully!",
      });

      setOpen(false);
      setFormData({
        cleanerId: null,
        paymentMethod: 'hourly',
        hourlyRate: 0,
        percentageRate: 70,
        hoursAssigned: 0
      });
      onSubCleanerAdded();
    } catch (error) {
      console.error('Error adding sub-cleaner:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Cleaner
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Additional Cleaner</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cleaner Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Cleaner</CardTitle>
            </CardHeader>
            <CardContent>
              <CleanerSelector onCleanerSelect={handleCleanerSelect} />
            </CardContent>
          </Card>

          {/* Payment & Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment & Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select 
                  value={formData.paymentMethod} 
                  onValueChange={(value: 'hourly' | 'percentage') => handleInputChange('paymentMethod', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly Rate</SelectItem>
                    <SelectItem value="percentage">Percentage of Total</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {formData.paymentMethod === 'hourly' ? (
                  <div>
                    <Label htmlFor="hourlyRate">Hourly Rate (£)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.hourlyRate}
                      onChange={(e) => handleInputChange('hourlyRate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="percentageRate">Percentage (%)</Label>
                    <Input
                      id="percentageRate"
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={formData.percentageRate}
                      onChange={(e) => handleInputChange('percentageRate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="hoursAssigned">Hours Assigned</Label>
                  <Input
                    id="hoursAssigned"
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={formData.hoursAssigned}
                    onChange={(e) => handleInputChange('hoursAssigned', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              {/* Pay Preview */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700">
                  Estimated Pay: £
                  {formData.paymentMethod === 'hourly' 
                    ? (formData.hoursAssigned * formData.hourlyRate).toFixed(2)
                    : formData.paymentMethod === 'percentage' 
                      ? ((formData.percentageRate || 0) + '%').toString()
                      : '0.00'
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Cleaner'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSubCleanerDialog;
