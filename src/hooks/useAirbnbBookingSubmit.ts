import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BookingSubmission {
  // Customer details
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Property details
  houseNumber: string;
  street: string;
  postcode: string;
  city: string;
  propertyAccess: string;
  accessNotes: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  
  // Service details
  serviceType: string;
  selectedDate: Date | null;
  selectedTime: string;
  
  // Costs
  totalCost: number;
  estimatedHours: number | null;
  hourlyRate: number;
  
  // Additional details
  notes: string;
  additionalDetails?: any;
}

export const useAirbnbBookingSubmit = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const submitBooking = async (bookingData: BookingSubmission, skipPaymentAuth = false) => {
    try {
      setLoading(true);

      // Step 1: Check if customer exists or create new one
      let customerId: number;
      
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', bookingData.email)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        // Create new customer
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            first_name: bookingData.firstName,
            last_name: bookingData.lastName,
            full_name: `${bookingData.firstName} ${bookingData.lastName}`,
            email: bookingData.email,
            phone: bookingData.phone,
            client_status: 'New'
          })
          .select('id')
          .single();

        if (customerError || !newCustomer) {
          throw new Error('Failed to create customer');
        }
        customerId = newCustomer.id;
      }

      // Step 2: Create booking
      const bookingDateTime = bookingData.selectedDate 
        ? new Date(`${bookingData.selectedDate.toISOString().split('T')[0]}T${bookingData.selectedTime}:00`)
        : null;

      const additionalDetailsObj = {
        ...bookingData.additionalDetails,
        accessNotes: bookingData.accessNotes,
        propertyAccess: bookingData.propertyAccess
      };

      const bookingInsert = {
        customer: customerId,
        first_name: bookingData.firstName,
        last_name: bookingData.lastName,
        email: bookingData.email,
        phone_number: bookingData.phone,
        address: `${bookingData.houseNumber} ${bookingData.street}`,
        postcode: bookingData.postcode,
        access: bookingData.propertyAccess,
        property_details: `${bookingData.propertyType} - ${bookingData.bedrooms} bed, ${bookingData.bathrooms} bath`,
        service_type: bookingData.serviceType,
        date_time: bookingDateTime?.toISOString(),
        total_cost: bookingData.totalCost,
        total_hours: bookingData.estimatedHours || 0,
        cleaning_cost_per_hour: bookingData.hourlyRate,
        payment_status: 'Unpaid',
        booking_status: 'active',
        additional_details: JSON.stringify(additionalDetailsObj)
      };

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingInsert)
        .select('id')
        .single();

      if (bookingError || !booking) {
        throw new Error('Failed to create booking');
      }

      // Step 3: Authorize payment only if not skipped (for non-urgent bookings)
      if (!skipPaymentAuth) {
        const { data: paymentResult, error: paymentError } = await supabase.functions.invoke(
          'stripe-authorize-payment',
          {
            body: {
              bookingId: booking.id
            }
          }
        );

        if (paymentError) {
          console.error('Payment authorization failed:', paymentError);
          // Booking is still created, just payment failed
          toast({
            title: "Booking Created",
            description: "Booking created but payment authorization failed. We'll contact you to complete payment.",
            variant: "destructive"
          });
          return { success: true, bookingId: booking.id, customerId, paymentFailed: true };
        }
      }

      return { success: true, bookingId: booking.id, customerId };

    } catch (error: any) {
      console.error('Error submitting booking:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    submitBooking,
    loading
  };
};
