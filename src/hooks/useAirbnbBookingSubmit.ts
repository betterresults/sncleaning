import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BookingSubmission {
  // Customer details
  customerId?: number; // Admin-provided customer ID
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Property address
  houseNumber: string;
  street: string;
  postcode: string;
  city: string;
  
  // Address selection (for admin/customer mode)
  addressId?: string | null;
  
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
  cleaningProducts?: string; // 'no' | 'products' | 'equipment' from form
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
  if (data.cleaningProducts) {
    details.cleaningProducts = {
      type: data.cleaningProducts,
      arrangement: data.equipmentArrangement,
      storageConfirmed: data.equipmentStorageConfirmed
    };
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
      
      // If customerId is provided (admin mode), use it directly
      if (bookingData.customerId) {
        customerId = bookingData.customerId;
      } else {
        // Check if customer exists by email
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
            console.error('Create customer failed:', customerError);
            throw new Error(customerError?.message || 'Failed to create customer');
          }
          customerId = newCustomer.id;
        }
      }

      // Step 1.5: Handle address - use addressId if provided, otherwise create new
      let addressForBooking = `${bookingData.houseNumber} ${bookingData.street}${bookingData.city ? ', ' + bookingData.city : ''}`;
      let postcodeForBooking = bookingData.postcode;
      
      if (bookingData.addressId) {
        // Use existing address from selection (admin/customer mode)
        const { data: addressData, error: addressError } = await supabase
          .from('addresses')
          .select('address, postcode')
          .eq('id', bookingData.addressId)
          .single();
        
        if (addressData && !addressError) {
          addressForBooking = addressData.address;
          postcodeForBooking = addressData.postcode;
        }
      } else if (customerId && !bookingData.customerId) {
        // Public booking - create new address for this customer (skip if admin provided customerId)
        try {
          await supabase
            .from('addresses')
            .insert({
              customer_id: customerId,
              address: addressForBooking,
              postcode: postcodeForBooking,
              is_default: false
            });
        } catch (addressError) {
          console.log('Note: Could not create address record, but will continue with booking:', addressError);
        }
      }

      // Step 2: Create booking
      console.log('[useAirbnbBookingSubmit] Creating booking datetime from:', {
        selectedDate: bookingData.selectedDate,
        selectedTime: bookingData.selectedTime,
        dateType: typeof bookingData.selectedDate,
        timeType: typeof bookingData.selectedTime
      });

      let bookingDateTime = null;
      if (bookingData.selectedDate && bookingData.selectedTime) {
        try {
          // Handle both Date objects and string dates
          const dateObj = bookingData.selectedDate instanceof Date 
            ? bookingData.selectedDate 
            : new Date(bookingData.selectedDate);
          
          console.log('[useAirbnbBookingSubmit] Date object:', dateObj, 'isValid:', !isNaN(dateObj.getTime()));
          
          // Validate the date
          if (!isNaN(dateObj.getTime())) {
            const dateStr = dateObj.toISOString().split('T')[0];
            
            // Convert time from "9:00 AM" format to 24-hour "09:00" format
            let time24 = bookingData.selectedTime;
            if (bookingData.selectedTime.includes('AM') || bookingData.selectedTime.includes('PM')) {
              const [time, period] = bookingData.selectedTime.split(' ');
              let [hours, minutes] = time.split(':');
              let hour = parseInt(hours);
              
              if (period === 'PM' && hour !== 12) {
                hour += 12;
              } else if (period === 'AM' && hour === 12) {
                hour = 0;
              }
              
              time24 = `${hour.toString().padStart(2, '0')}:${minutes}`;
            }
            
            console.log('[useAirbnbBookingSubmit] Converted time:', bookingData.selectedTime, '->', time24);
            
            bookingDateTime = new Date(`${dateStr}T${time24}:00`);
            
            console.log('[useAirbnbBookingSubmit] Created booking datetime:', bookingDateTime.toISOString());
            
            // Validate the final datetime
            if (isNaN(bookingDateTime.getTime())) {
              console.error('Invalid datetime created:', { dateStr, time: time24 });
              bookingDateTime = null;
            }
          } else {
            console.error('Invalid date object:', bookingData.selectedDate);
          }
        } catch (error) {
          console.error('Error creating booking datetime:', error);
          bookingDateTime = null;
        }
      } else {
        console.warn('[useAirbnbBookingSubmit] Missing selectedDate or selectedTime:', {
          hasDate: !!bookingData.selectedDate,
          hasTime: !!bookingData.selectedTime
        });
      }

      const totalHours = (bookingData.totalHours || bookingData.estimatedHours || 0) + 
                         (bookingData.extraHours || 0) + 
                         (bookingData.ironingHours || 0);

      // Generate incremental ID because bookings.id has no default
      const { data: latestBooking } = await supabase
        .from('bookings')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .single();
      const nextId = (latestBooking?.id ?? 0) + 1;

      const bookingInsert: any = {
        // Primary Key
        id: nextId,
        // Customer
        customer: customerId,
        first_name: bookingData.firstName,
        last_name: bookingData.lastName,
        email: bookingData.email,
        phone_number: bookingData.phone,
        
        // Address
        address: addressForBooking,
        postcode: postcodeForBooking,
        
        // Property details (JSON with ALL property info)
        property_details: buildPropertyDetails(bookingData),
        
        // Service
        service_type: 'airbnb', // Service type key from company_settings
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
        
        // Cleaner - only add if not set (no default value)
        cleaner_percentage: null,
        
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
        console.error('Booking insert failed:', bookingError, { bookingInsert });
        throw new Error(bookingError?.message || 'Failed to create booking');
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
