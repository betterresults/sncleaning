import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DomesticBookingSubmission {
  customerId?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  houseNumber: string;
  street: string;
  postcode: string;
  city: string;
  addressId?: string | null;
  
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  toilets?: string;
  numberOfFloors?: number;
  additionalRooms?: Record<string, number>;
  propertyFeatures?: Record<string, boolean>;
  
  serviceFrequency: string;
  wantsFirstDeepClean?: boolean;
  firstDeepCleanExtraHours?: number;
  ovenType?: string;
  cleaningProducts?: string;
  equipmentArrangement?: string | null;
  equipmentStorageConfirmed?: boolean;
  
  selectedDate: Date | null;
  selectedTime: string;
  flexibility?: string;
  shortNoticeCharge?: number;
  
  propertyAccess: string;
  accessNotes: string;
  
  totalCost: number;
  estimatedHours: number | null;
  totalHours?: number;
  hourlyRate: number;
  
  // First deep clean fields
  firstDeepCleanHours?: number;
  firstDeepCleanCost?: number;
  regularRecurringCost?: number;
  
  notes: string;
  additionalDetails?: any;
  cleanerId?: number;
  paymentMethod?: string;
  
  // Agent attribution (from short link/quote lead)
  agentUserId?: string; // Sales agent who created the quote
}

const buildPropertyDetails = (data: DomesticBookingSubmission) => {
  const propertyDetails: any = {
    type: data.propertyType || 'flat',
    bedrooms: data.bedrooms || '1',
    bathrooms: data.bathrooms || '1',
  };
  
  if (data.toilets) propertyDetails.toilets = data.toilets;
  if (data.numberOfFloors && data.numberOfFloors > 0) propertyDetails.numberOfFloors = data.numberOfFloors;
  if (data.additionalRooms && Object.values(data.additionalRooms).some(v => v > 0)) {
    propertyDetails.additionalRooms = data.additionalRooms;
  }
  if (data.propertyFeatures && Object.values(data.propertyFeatures).some(v => v === true)) {
    propertyDetails.propertyFeatures = data.propertyFeatures;
  }
  
  return JSON.stringify(propertyDetails);
};

const buildAdditionalDetails = (data: DomesticBookingSubmission) => {
  const details: any = {};
  
  details.serviceFrequency = data.serviceFrequency || 'onetime';
  
  // First deep clean info
  if (data.wantsFirstDeepClean) {
    details.firstDeepClean = {
      enabled: true,
      extraHours: data.firstDeepCleanExtraHours || 0,
      hours: data.firstDeepCleanHours || 0,
      cost: data.firstDeepCleanCost || 0,
      regularRecurringCost: data.regularRecurringCost || 0,
    };
  }
  
  if (data.ovenType && data.ovenType !== 'dontneed' && data.ovenType !== '') {
    details.ovenCleaning = { needed: true, type: data.ovenType };
  }
  
  if (data.cleaningProducts && data.cleaningProducts !== '') {
    details.cleaningProducts = {
      type: data.cleaningProducts,
      arrangement: data.equipmentArrangement || null,
      storageConfirmed: data.equipmentStorageConfirmed || false
    };
  }
  
  if (data.flexibility) details.flexibility = data.flexibility;
  if (data.shortNoticeCharge && data.shortNoticeCharge > 0) details.shortNoticeCharge = data.shortNoticeCharge;
  
  details.access = { 
    method: data.propertyAccess || 'customer-home', 
    notes: data.accessNotes || '' 
  };
  if (data.notes) details.notes = data.notes;
  
  return JSON.stringify(details);
};

// Helper function to calculate end_date_time from a datetime string (London time)
const calculateEndDateTime = (startDateTimeStr: string, hours: number): string => {
  const match = startDateTimeStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return startDateTimeStr;
  
  let year = parseInt(match[1]);
  let month = parseInt(match[2]);
  let day = parseInt(match[3]);
  let hour = parseInt(match[4]) + Math.floor(hours);
  let minute = parseInt(match[5]) + Math.round((hours % 1) * 60);
  
  if (minute >= 60) {
    hour += Math.floor(minute / 60);
    minute = minute % 60;
  }
  
  if (hour >= 24) {
    day += Math.floor(hour / 24);
    hour = hour % 24;
  }
  
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+00:00`;
};

export const useDomesticBookingSubmit = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const submitBooking = async (bookingData: DomesticBookingSubmission, skipPaymentAuth = false) => {
    try {
      setLoading(true);

      let customerId: number;
      let hasPaymentMethods = false;
      
      if (bookingData.customerId) {
        customerId = bookingData.customerId;
        
        const { data: paymentMethods } = await supabase
          .from('customer_payment_methods')
          .select('id')
          .eq('customer_id', customerId)
          .limit(1);
        
        hasPaymentMethods = (paymentMethods && paymentMethods.length > 0);
      } else {
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', bookingData.email)
          .single();

        if (existingCustomer) {
          customerId = existingCustomer.id;
          
          const { data: paymentMethods } = await supabase
            .from('customer_payment_methods')
            .select('id')
            .eq('customer_id', customerId)
            .limit(1);
          
          hasPaymentMethods = (paymentMethods && paymentMethods.length > 0);
        } else {
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
            throw new Error(customerError?.message || 'Failed to create customer');
          }
          customerId = newCustomer.id;
        }
      }

      let addressForBooking = `${bookingData.houseNumber} ${bookingData.street}${bookingData.city ? ', ' + bookingData.city : ''}`;
      let postcodeForBooking = bookingData.postcode;
      
      if (bookingData.addressId) {
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
          console.log('Note: Could not create address record:', addressError);
        }
      }

      let bookingDateTimeStr: string | null = null;
      let time24ForDB: string | null = null;
      let dateStr: string | null = null;
      
      // Extract date regardless of whether time is selected (for flexible-time bookings)
      if (bookingData.selectedDate) {
        try {
          // Extract date string without timezone conversion
          if (bookingData.selectedDate instanceof Date) {
            const d = bookingData.selectedDate;
            dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          } else {
            // Parse string date and extract components
            const d = new Date(bookingData.selectedDate);
            dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          }
          
          // Only process time if it's provided (not flexible-time)
          if (bookingData.selectedTime) {
            let time24 = bookingData.selectedTime;
            if (time24.includes(' - ')) {
              time24 = time24.split(' - ')[0].trim();
            }
            
            if (time24.toLowerCase().includes('am') || time24.toLowerCase().includes('pm')) {
              const timeStr = time24.toLowerCase().replace(/\s+/g, '');
              const isPM = timeStr.includes('pm');
              const numericPart = timeStr.replace(/[ap]m/g, '');
              
              let hour: number;
              let minutes: number = 0;
              
              if (numericPart.includes(':')) {
                const parts = numericPart.split(':');
                hour = parseInt(parts[0]);
                minutes = parseInt(parts[1]);
              } else {
                hour = parseInt(numericPart);
              }
              
              if (isPM && hour !== 12) hour += 12;
              else if (!isPM && hour === 12) hour = 0;
              
              time24 = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }
            
            time24ForDB = time24;
            // Store as London time string without timezone conversion
            bookingDateTimeStr = `${dateStr}T${time24}:00+00:00`;
          } else {
            // For flexible-time bookings, set date_time to 9am as default placeholder
            // This ensures the booking appears on the calendar on the correct day
            bookingDateTimeStr = `${dateStr}T09:00:00+00:00`;
          }
        } catch (error) {
          console.error('Error creating booking datetime:', error);
          bookingDateTimeStr = null;
          time24ForDB = null;
          dateStr = null;
        }
      }

      // Use totalHours consistently - this includes first deep clean extra hours
      const totalHours = bookingData.totalHours || bookingData.estimatedHours || 0;
      // Regular hours is the base hours without first deep clean extras
      const regularHours = bookingData.estimatedHours || totalHours;

      // Get current user and their role for tracking
      const { data: { user } } = await supabase.auth.getUser();
      let createdBySource = 'website';
      let createdByUserId: string | null = null;
      
      // If agentUserId is provided (from short link), use it - this takes priority
      if (bookingData.agentUserId) {
        createdByUserId = bookingData.agentUserId;
        createdBySource = 'sales_agent';
      } else if (user) {
        createdByUserId = user.id;
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (userRole?.role === 'admin') {
          createdBySource = 'admin';
        } else if (userRole?.role === 'sales_agent') {
          createdBySource = 'sales_agent';
        } else {
          createdBySource = 'customer';
        }
      }

      // Note: Do NOT set 'id' - let the database auto-generate it (identity column)
      const bookingInsert: any = {
        customer: customerId,
        first_name: bookingData.firstName || '',
        last_name: bookingData.lastName || '',
        email: bookingData.email || '',
        phone_number: bookingData.phone || '',
        
        address: addressForBooking || '',
        postcode: postcodeForBooking || '',
        
        property_details: buildPropertyDetails(bookingData),
        
        service_type: 'Domestic',
        cleaning_type: bookingData.wantsFirstDeepClean ? 'Deep Cleaning' : 'Standard Cleaning',
        frequently: bookingData.serviceFrequency || 'onetime',
        
        // Dates - stored as London time without timezone conversion
        date_time: bookingDateTimeStr || null,
        date_only: dateStr || null,
        time_only: (bookingData.flexibility === 'flexible-time' || !bookingData.selectedTime) 
          ? null 
          : time24ForDB,
        
        hours_required: totalHours,
        total_hours: totalHours,
        recommended_hours: regularHours,
        cleaning_cost_per_hour: bookingData.hourlyRate || 0,
        total_cost: bookingData.totalCost || 0,
        
        payment_method: bookingData.paymentMethod || (hasPaymentMethods ? 'Stripe' : null),
        payment_status: 'Unpaid',
        booking_status: 'active',
        
        cleaner: bookingData.cleanerId && bookingData.cleanerId > 0 ? bookingData.cleanerId : null,
        cleaner_percentage: null,
        
        access: bookingData.propertyAccess || null,
        
        additional_details: buildAdditionalDetails(bookingData),
        
        // Tracking - who created this booking (agentUserId takes priority if from quote link)
        created_by_user_id: createdByUserId,
        created_by_source: createdBySource
      };

      if (bookingDateTimeStr && totalHours > 0) {
        bookingInsert.end_date_time = calculateEndDateTime(bookingDateTimeStr, totalHours);
      }

      if (bookingData.ovenType && bookingData.ovenType !== 'dontneed' && bookingData.ovenType !== '') {
        bookingInsert.oven_size = bookingData.ovenType;
      }

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

      // Generate recurring group ID if this is a recurring booking
      const isRecurring = bookingData.serviceFrequency && 
        bookingData.serviceFrequency !== 'onetime' && 
        bookingData.serviceFrequency !== 'one-time';
      
      const recurringGroupId = isRecurring ? crypto.randomUUID() : null;

      // Add recurring group ID to the booking insert
      if (recurringGroupId) {
        bookingInsert.recurring_group_id = recurringGroupId;
      }

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingInsert)
        .select('id')
        .single();

      if (bookingError || !booking) {
        console.error('Create booking failed:', bookingError);
        throw new Error(bookingError?.message || 'Failed to create booking');
      }

      // Insert primary cleaner into booking_cleaners if assigned
      if (bookingData.cleanerId && bookingData.cleanerId > 0) {
        try {
          // Calculate cleaner pay based on total cost and default percentage
          const cleanerPercentage = 50; // Default 50%, can be adjusted
          const calculatedPay = (bookingData.totalCost || 0) * (cleanerPercentage / 100);
          
          await supabase.from('booking_cleaners').insert({
            booking_id: booking.id,
            cleaner_id: bookingData.cleanerId,
            is_primary: true,
            payment_type: 'percentage',
            percentage_rate: cleanerPercentage,
            hours_assigned: totalHours,
            calculated_pay: calculatedPay,
            status: 'assigned'
          });
          console.log('[useDomesticBookingSubmit] Created booking_cleaners entry for primary cleaner');
        } catch (cleanerError) {
          console.error('[useDomesticBookingSubmit] Failed to create booking_cleaners entry:', cleanerError);
          // Don't fail the booking if this fails
        }
      }

      // Create recurring service if this is a recurring booking
      if (isRecurring && recurringGroupId) {
        console.log('[useDomesticBookingSubmit] Creating recurring service for frequency:', bookingData.serviceFrequency);
        
        // Determine interval based on frequency
        let interval = '7'; // Default to weekly
        if (bookingData.serviceFrequency === 'fortnightly' || bookingData.serviceFrequency === 'bi-weekly') {
          interval = '14';
        } else if (bookingData.serviceFrequency === 'monthly') {
          interval = '30';
        }

        // Map frequency to day of week from selected date
        let dayOfWeek = '';
        if (bookingData.selectedDate) {
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const dateObj = bookingData.selectedDate instanceof Date 
            ? bookingData.selectedDate 
            : new Date(bookingData.selectedDate);
          dayOfWeek = days[dateObj.getDay()];
        }

        // Get or create address ID for recurring service
        let addressIdForRecurring = bookingData.addressId;
        if (!addressIdForRecurring) {
          // Try to find or create address
          const { data: existingAddress } = await supabase
            .from('addresses')
            .select('id')
            .eq('customer_id', customerId)
            .eq('address', addressForBooking)
            .maybeSingle();
          
          if (existingAddress) {
            addressIdForRecurring = existingAddress.id;
          } else {
            const { data: newAddress } = await supabase
              .from('addresses')
              .insert({
                customer_id: customerId,
                address: addressForBooking,
                postcode: postcodeForBooking,
                is_default: false
              })
              .select('id')
              .single();
            
            if (newAddress) {
              addressIdForRecurring = newAddress.id;
            }
          }
        }

        // Calculate recurring cost (without first deep clean extras)
        const recurringCost = bookingData.regularRecurringCost || (regularHours * (bookingData.hourlyRate || 0));

        const recurringServiceData = {
          customer: customerId,
          address: addressIdForRecurring || addressForBooking,
          cleaner: bookingData.cleanerId && bookingData.cleanerId > 0 ? bookingData.cleanerId : null,
          cleaner_rate: null as number | null, // Will be set when cleaner is assigned
          cleaning_type: 'Domestic',
          frequently: bookingData.serviceFrequency,
          days_of_the_week: dayOfWeek,
          hours: String(regularHours), // Regular hours for ongoing cleaning (stored as string in DB)
          cost_per_hour: bookingData.hourlyRate || 0,
          total_cost: recurringCost,
          payment_method: bookingData.paymentMethod || null,
          start_date: dateStr || null,
          start_time: time24ForDB ? `${time24ForDB}:00+00` : null,
          postponed: false,
          interval: interval,
          recurring_group_id: recurringGroupId,
          created_by_user_id: createdByUserId,
          created_by_source: createdBySource
        };

        const { error: recurringError } = await supabase
          .from('recurring_services')
          .insert([recurringServiceData]);

        if (recurringError) {
          console.error('[useDomesticBookingSubmit] Failed to create recurring service:', recurringError);
          // Don't fail the whole booking if recurring service creation fails
        } else {
          console.log('[useDomesticBookingSubmit] Recurring service created successfully');
        }
      }

      // Handle payment authorization if customer has payment methods
      if (!skipPaymentAuth && hasPaymentMethods && bookingData.totalCost > 0) {
        try {
          const { data: authResult, error: authError } = await supabase.functions.invoke('stripe-authorize-payment', {
            body: {
              bookingId: booking.id,
              amount: Math.round(bookingData.totalCost * 100),
              customerId: customerId
            }
          });

          if (authError) {
            console.error('Payment authorization failed:', authError);
          } else if (authResult?.success) {
            await supabase
              .from('bookings')
              .update({ 
                payment_status: 'authorized',
                invoice_id: authResult.paymentIntentId
              })
              .eq('id', booking.id);
          }
        } catch (paymentError) {
          console.error('Payment authorization error:', paymentError);
        }
      }

      toast({
        title: 'Booking Created!',
        description: `Your domestic cleaning booking has been confirmed.`,
      });

      return { success: true, bookingId: booking.id, customerId };
    } catch (error: any) {
      console.error('Booking submission error:', error);
      toast({
        title: 'Booking Failed',
        description: error.message || 'Failed to create booking. Please try again.',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return { submitBooking, loading };
};