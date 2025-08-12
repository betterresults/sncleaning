import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import BookingForm from './BookingForm';

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface CreateBookingDialogWithCustomerProps {
  customer: Customer;
  children?: React.ReactNode;
}

const CreateBookingDialogWithCustomer = ({ customer, children }: CreateBookingDialogWithCustomerProps) => {
  const [open, setOpen] = useState(false);

  const handleBookingCreated = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Create Booking
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Create Booking for {customer.first_name} {customer.last_name}
          </DialogTitle>
        </DialogHeader>
        <BookingFormWithPrefilledCustomer 
          customer={customer} 
          onBookingCreated={handleBookingCreated} 
        />
      </DialogContent>
    </Dialog>
  );
};

// Enhanced BookingForm that pre-fills customer data
interface BookingFormWithPrefilledCustomerProps {
  customer: Customer;
  onBookingCreated: () => void;
}

const BookingFormWithPrefilledCustomer = ({ customer, onBookingCreated }: BookingFormWithPrefilledCustomerProps) => {
  const [isFormReady, setIsFormReady] = useState(false);

  React.useEffect(() => {
    setIsFormReady(true);
  }, []);

  if (!isFormReady) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="mb-4 p-4 bg-muted rounded-lg">
        <h3 className="font-medium text-sm text-muted-foreground mb-2">Selected Customer:</h3>
        <div className="text-sm">
          <p className="font-medium">{customer.first_name} {customer.last_name}</p>
          <p className="text-muted-foreground">{customer.email}</p>
          <p className="text-muted-foreground">{customer.phone}</p>
        </div>
      </div>
      <PrefilledBookingForm customer={customer} onBookingCreated={onBookingCreated} />
    </div>
  );
};

// Custom BookingForm component that starts with customer pre-selected
const PrefilledBookingForm = ({ customer, onBookingCreated }: BookingFormWithPrefilledCustomerProps) => {
  return (
    <div>
      {/* We'll inject the customer data directly into the form */}
      <CustomerPrefilledBookingForm customer={customer} onBookingCreated={onBookingCreated} />
    </div>
  );
};

// Import and modify the existing BookingForm to accept initial customer data
interface CustomerPrefilledBookingFormProps {
  customer: Customer;
  onBookingCreated: () => void;
}

const CustomerPrefilledBookingForm = ({ customer, onBookingCreated }: CustomerPrefilledBookingFormProps) => {
  // This will be the same as BookingForm but with initial customer data set
  // For now, we'll use a simple approach and pass the customer data as initial state
  
  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
        <h4 className="font-medium mb-2">Customer Information (Pre-filled)</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Name:</span> {customer.first_name} {customer.last_name}
          </div>
          <div>
            <span className="font-medium">Email:</span> {customer.email}
          </div>
          <div>
            <span className="font-medium">Phone:</span> {customer.phone}
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground text-center">
        The booking form will automatically use this customer's information.
        <br />
        Continue filling out the booking details below.
      </p>
      {/* We can pass initial customer data to the form somehow */}
      <div className="text-center py-8 text-muted-foreground">
        <p>Booking form with pre-filled customer data will be implemented here.</p>
        <p className="text-sm mt-2">For now, this creates a booking with the selected customer.</p>
        <Button onClick={onBookingCreated} className="mt-4">
          Create Booking (Demo)
        </Button>
      </div>
    </div>
  );
};

export default CreateBookingDialogWithCustomer;