
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import BookingForm from './BookingForm';

interface CreateBookingDialogProps {
  children?: React.ReactNode;
}

const CreateBookingDialog = ({ children }: CreateBookingDialogProps) => {
  const [open, setOpen] = useState(false);

  const handleBookingCreated = () => {
    setOpen(false);
    // Optionally refresh the bookings list or show a success message
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add New Booking
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Create New Booking</DialogTitle>
        </DialogHeader>
        <BookingForm onBookingCreated={handleBookingCreated} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateBookingDialog;
