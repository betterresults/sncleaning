
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import NewBookingForm from './NewBookingForm';
import { useQueryClient } from '@tanstack/react-query';

interface CreateNewBookingDialogProps {
  children?: React.ReactNode;
}

const CreateNewBookingDialog = ({ children }: CreateNewBookingDialogProps) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleBookingCreated = () => {
    setOpen(false);
    // Refresh all booking-related queries
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    queryClient.invalidateQueries({ queryKey: ['upcoming-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['past-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['available-bookings'] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create New Booking
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Create New Booking</DialogTitle>
        </DialogHeader>
        <NewBookingForm onBookingCreated={handleBookingCreated} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateNewBookingDialog;
