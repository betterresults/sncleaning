import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BookingSubmission {
  // Customer details
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Property address
  houseNumber: string;
  street: string;
  postcode: string;
  city: string;
  
  // Property details (ALL go to property_details JSON)
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  toilets?: string;
  numberOfFloors?: number;
  additionalRooms?: {
    toilets: number;
    studyRooms: number;
    utilityRooms: number;
    otherRooms: number;
  };
  propertyFeatures?: Record<string, boolean>;
  
  // Service details
  serviceType: string; // cleaning_type in DB (checkin-checkout, midstay, light, deep)
  alreadyCleaned?: boolean | null;
  needsOvenCleaning?: boolean | null;
  ovenType?: string;
  cleaningProducts?: {
    needed: boolean | null;
    equipment: boolean | null;
  };
  equipmentArrangement?: string | null;
  equipmentStorageConfirmed?: boolean;
  
  // Linens
  linensHandling?: string;
  needsIroning?: boolean | null;
  ironingHours?: number;
  linenPackages?: Record<string, number>;
  extraHours?: number;
  
  // Schedule
  selectedDate: Date | null;
  selectedTime: string;
  flexibility?: string;
  sameDayTurnaround?: boolean;
  shortNoticeCharge?: number;
  
  // Access
  propertyAccess: string;
  accessNotes: string;
  
  // Costs
  totalCost: number;
  estimatedHours: number | null; // hours_required (system calculated)
  totalHours?: number; // total_hours (may be different from estimated)
  hourlyRate: number;
  
  // Notes
  notes: string;
  additionalDetails?: any;
}

// Helper function to build property_details JSON
const buildPropertyDetails = (data: BookingSubmission) => {
  const propertyDetails: any = {
    type: data.propertyType,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
  };
  
  if (data.toilets) {
    propertyDetails.toilets = data.toilets;
  }
  
  if (data.numberOfFloors) {
    propertyDetails.numberOfFloors = data.numberOfFloors;
  }
  
  if (data.additionalRooms && Object.values(data.additionalRooms).some(v => v > 0)) {
    propertyDetails.additionalRooms = data.additionalRooms;
  }
  
  if (data.propertyFeatures && Object.values(data.propertyFeatures).some(v => v === true)) {
    propertyDetails.propertyFeatures = data.propertyFeatures;
  }
  
  return JSON.stringify(propertyDetails);
};

// Helper function to build additional_details JSON
const buildAdditionalDetails = (data: BookingSubmission) => {
  const details: any = {};
  
  // Cleaning history
  if (data.alreadyCleaned !== null && data.alreadyCleaned !== undefined) {
    details.alreadyCleaned = data.alreadyCleaned;
  }
  
  // Oven cleaning
  if (data.needsOvenCleaning) {
    details.ovenCleaning = {
      needed: true,
      type: data.ovenType
    };
  }
  
  // Cleaning products & equipment
  if (data.cleaningProducts?.needed !== null && data.cleaningProducts?.needed !== undefined) {
    details.cleaningProducts = data.cleaningProducts;
  }
  
  if (data.equipmentArrangement) {
    details.equipmentArrangement = data.equipmentArrangement;
    details.equipmentStorageConfirmed = data.equipmentStorageConfirmed;
  }
  
  // Linens
  if (data.linensHandling) {
    details.linensHandling = data.linensHandling;
  }
  
  if (data.needsIroning) {
    details.ironing = {
      needed: true,
      hours: data.ironingHours || 0
    };
  }
  
  if (data.extraHours && data.extraHours > 0) {
    details.extraHours = data.extraHours;
  }
  
  // Scheduling
  if (data.flexibility) {
    details.flexibility = data.flexibility;
  }
  
  if (data.sameDayTurnaround) {
    details.sameDayTurnaround = true;
  }
  
  if (data.shortNoticeCharge && data.shortNoticeCharge > 0) {
    details.shortNoticeCharge = data.shortNoticeCharge;
  }
  
  // Access
  details.access = {
    method: data.propertyAccess,
    notes: data.accessNotes
  };
  
  // General notes
  if (data.notes) {
    details.notes = data.notes;
  }
  
  return JSON.stringify(details);
};

// Helper function to build linen_used array
const buildLinenUsedArray = (linenPackages?: Record<string, number>) => {
  if (!linenPackages || Object.keys(linenPackages).length === 0) {
    return null;
  }
  
  const linenArray = Object.entries(linenPackages)
    .filter(([_, quantity]) => quantity > 0)
    .map(([productId, quantity]) => ({
      product_id: productId,
      quantity: quantity
    }));
  
  return linenArray.length > 0 ? JSON.stringify(linenArray) : null;
};

// Helper function to calculate end_date_time
const calculateEndDateTime = (startDateTime: Date, hours: number): string => {
  const endDate = new Date(startDateTime);
  endDate.setHours(endDate.getHours() + Math.floor(hours));
  endDate.setMinutes(endDate.getMinutes() + ((hours % 1) * 60));
  return endDate.toISOString();
};

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

      const totalHours = (bookingData.totalHours || bookingData.estimatedHours || 0) + 
                         (bookingData.extraHours || 0) + 
                         (bookingData.ironingHours || 0);

      const bookingInsert: any = {
        // Customer
        customer: customerId,
        first_name: bookingData.firstName,
        last_name: bookingData.lastName,
        email: bookingData.email,
        phone_number: bookingData.phone,
        
        // Address
        address: `${bookingData.houseNumber} ${bookingData.street}${bookingData.city ? ', ' + bookingData.city : ''}`,
        postcode: bookingData.postcode,
        
        // Property details (JSON with ALL property info)
        property_details: buildPropertyDetails(bookingData),
        
        // Service
        service_type: 'Air BnB', // FIXED - form name
        cleaning_type: bookingData.serviceType, // checkin-checkout, midstay, etc.
        
        // Dates
        date_time: bookingDateTime?.toISOString(),
        
        // Hours
        hours_required: bookingData.estimatedHours || 0, // system calculated
        total_hours: totalHours, // actual hours
        cleaning_cost_per_hour: bookingData.hourlyRate,
        total_cost: bookingData.totalCost,
        
        // Payment
        payment_method: 'Stripe',
        payment_status: 'Unpaid',
        booking_status: 'active',
        
        // Access
        access: bookingData.propertyAccess,
        
        // Additional details (JSON with service, schedule, access info)
        additional_details: buildAdditionalDetails(bookingData)
      };

      // Conditional fields - only add if they have values
      if (bookingDateTime && totalHours > 0) {
        bookingInsert.end_date_time = calculateEndDateTime(bookingDateTime, totalHours);
      }

      if (bookingData.alreadyCleaned === false) {
        bookingInsert.first_cleaning = 'No';
      } else if (bookingData.alreadyCleaned === true) {
        bookingInsert.first_cleaning = 'Yes';
      }

      if (bookingData.needsOvenCleaning && bookingData.ovenType) {
        bookingInsert.oven_size = bookingData.ovenType;
      }

      if (bookingData.linensHandling) {
        bookingInsert.linens = bookingData.linensHandling;
      }

      if (bookingData.needsIroning) {
        bookingInsert.ironing = 'Yes';
        bookingInsert.ironing_hours = bookingData.ironingHours || 0;
      }

      if (bookingData.sameDayTurnaround) {
        bookingInsert.same_day = true;
      }

      // Linen management
      if (bookingData.linensHandling === 'order-linens') {
        bookingInsert.linen_management = true;
        const linenUsed = buildLinenUsedArray(bookingData.linenPackages);
        if (linenUsed) {
          bookingInsert.linen_used = linenUsed;
        }
      }

      // Extras - additional rooms
      if (bookingData.additionalRooms && Object.values(bookingData.additionalRooms).some(v => v > 0)) {
        const extrasArray = [];
        if (bookingData.additionalRooms.studyRooms > 0) {
          extrasArray.push(`Study rooms: ${bookingData.additionalRooms.studyRooms}`);
        }
        if (bookingData.additionalRooms.utilityRooms > 0) {
          extrasArray.push(`Utility rooms: ${bookingData.additionalRooms.utilityRooms}`);
        }
        if (bookingData.additionalRooms.otherRooms > 0) {
          extrasArray.push(`Other rooms: ${bookingData.additionalRooms.otherRooms}`);
        }
        if (extrasArray.length > 0) {
          bookingInsert.extras = extrasArray.join(', ');
        }
      }

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
