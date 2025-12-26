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
  subServiceType?: string; // service_type in DB (airbnb, domestic, commercial)
  serviceType: string; // cleaning_type in DB (checkin-checkout, midstay, light, deep)
  alreadyCleaned?: boolean | null;
  ovenType?: string;
  cleaningProducts?: string; // Convert from array: 'no', 'products', 'equipment', 'products,equipment'
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
  serviceFrequency?: string; // weekly, biweekly, monthly, onetime
  weeklyCost?: number; // Recurring weekly cost (may include discounts)
  
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
  cleanerId?: number; // Cleaner assignment
  paymentMethod?: string; // Payment method
  
  // Agent attribution (from short link/quote lead)
  agentUserId?: string; // Sales agent who created the quote
}

// Helper function to build property_details JSON
const buildPropertyDetails = (data: BookingSubmission) => {
  const propertyDetails: any = {
    type: data.propertyType || 'flat',
    bedrooms: data.bedrooms || '1',
    bathrooms: data.bathrooms || '1',
  };
  
  if (data.toilets) {
    propertyDetails.toilets = data.toilets;
  }
  
  if (data.numberOfFloors && data.numberOfFloors > 0) {
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
  if (data.ovenType && data.ovenType !== 'dontneed' && data.ovenType !== '') {
    details.ovenCleaning = {
      needed: true,
      type: data.ovenType
    };
  }
  
  // Cleaning products & equipment
  if (data.cleaningProducts && data.cleaningProducts !== '') {
    details.cleaningProducts = {
      type: data.cleaningProducts,
      arrangement: data.equipmentArrangement || null,
      storageConfirmed: data.equipmentStorageConfirmed || false
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
    method: data.propertyAccess || 'customer-home',
    notes: data.accessNotes || ''
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

// Helper function to calculate end_date_time from a datetime string (London time)
const calculateEndDateTime = (startDateTimeStr: string, hours: number): string => {
  // Parse the datetime string (format: YYYY-MM-DDTHH:MM:SS+00:00)
  const match = startDateTimeStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return startDateTimeStr;
  
  let year = parseInt(match[1]);
  let month = parseInt(match[2]);
  let day = parseInt(match[3]);
  let hour = parseInt(match[4]) + Math.floor(hours);
  let minute = parseInt(match[5]) + Math.round((hours % 1) * 60);
  
  // Handle minute overflow
  if (minute >= 60) {
    hour += Math.floor(minute / 60);
    minute = minute % 60;
  }
  
  // Handle hour overflow (simple day rollover)
  if (hour >= 24) {
    day += Math.floor(hour / 24);
    hour = hour % 24;
  }
  
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+00:00`;
};

export const useAirbnbBookingSubmit = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const submitBooking = async (bookingData: BookingSubmission, skipPaymentAuth = false) => {
    try {
      setLoading(true);

      // Step 1: Check if customer exists or create new one
      let customerId: number;
      let hasPaymentMethods = false;
      
      // If customerId is provided (admin mode), use it directly
      if (bookingData.customerId) {
        customerId = bookingData.customerId;
        
        // Check if customer has saved payment methods
        const { data: paymentMethods } = await supabase
          .from('customer_payment_methods')
          .select('id')
          .eq('customer_id', customerId)
          .limit(1);
        
        hasPaymentMethods = (paymentMethods && paymentMethods.length > 0);
      } else {
        // Check if customer exists by email
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', bookingData.email)
          .single();

        if (existingCustomer) {
          customerId = existingCustomer.id;
          
          // Check if customer has saved payment methods
          const { data: paymentMethods } = await supabase
            .from('customer_payment_methods')
            .select('id')
            .eq('customer_id', customerId)
            .limit(1);
          
          hasPaymentMethods = (paymentMethods && paymentMethods.length > 0);
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

      let bookingDateTimeStr: string | null = null;
      let time24ForDB: string | null = null;
      let dateStr: string | null = null;
      
      // Extract date regardless of whether time is selected (for flexible-time bookings)
      if (bookingData.selectedDate) {
        try {
          // Extract date string without timezone conversion - treat input as London time
          if (bookingData.selectedDate instanceof Date) {
            const d = bookingData.selectedDate;
            dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          } else {
            const d = new Date(bookingData.selectedDate);
            dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          }
          
          console.log('[useAirbnbBookingSubmit] Date string (London time):', dateStr);
          
          // Only process time if it's provided (not flexible-time)
          if (bookingData.selectedTime) {
            // Convert time from various formats to 24-hour "HH:MM" format
            let time24 = bookingData.selectedTime;
            
            // Extract start time if it's a range (e.g., "9am - 10am" -> "9am")
            if (time24.includes(' - ')) {
              time24 = time24.split(' - ')[0].trim();
            }
            
            // Handle formats like "9am", "10pm", "9:00 AM", "10:30 PM"
            if (time24.toLowerCase().includes('am') || time24.toLowerCase().includes('pm')) {
              const timeStr = time24.toLowerCase().replace(/\s+/g, '');
              const isPM = timeStr.includes('pm');
              const isAM = timeStr.includes('am');
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
              
              if (isPM && hour !== 12) {
                hour += 12;
              } else if (isAM && hour === 12) {
                hour = 0;
              }
              
              time24 = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }
            
            console.log('[useAirbnbBookingSubmit] Converted time:', bookingData.selectedTime, '->', time24);
            
            time24ForDB = time24;
            // Store as London time string without timezone conversion
            bookingDateTimeStr = `${dateStr}T${time24}:00+00:00`;
            
            console.log('[useAirbnbBookingSubmit] Final datetime string (London):', bookingDateTimeStr);
          } else {
            // For flexible-time bookings, set date_time to 9am as default placeholder
            // This ensures the booking appears on the calendar on the correct day
            bookingDateTimeStr = `${dateStr}T09:00:00+00:00`;
            console.log('[useAirbnbBookingSubmit] Flexible time - using default 9am:', bookingDateTimeStr);
          }
        } catch (error) {
          console.error('Error creating booking datetime:', error);
          bookingDateTimeStr = null;
          time24ForDB = null;
          dateStr = null;
        }
      } else {
        console.warn('[useAirbnbBookingSubmit] Missing selectedDate');
      }

      const totalHours = (bookingData.totalHours || bookingData.estimatedHours || 0) + 
                         (bookingData.extraHours || 0) + 
                         (bookingData.ironingHours || 0);

      // Get current user and their role for tracking
      const { data: { user } } = await supabase.auth.getUser();
      let createdBySource = 'website';
      let createdByUserId: string | null = null;
      
      // If agentUserId is provided (from short link), use it
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
        // Customer
        customer: customerId,
        first_name: bookingData.firstName || '',
        last_name: bookingData.lastName || '',
        email: bookingData.email || '',
        phone_number: bookingData.phone || '',
        
        // Address
        address: addressForBooking || '',
        postcode: postcodeForBooking || '',
        
        // Property details (JSON with ALL property info)
        property_details: buildPropertyDetails(bookingData),
        
        // Service - map subServiceType to proper display name for database
        service_type: (() => {
          const subType = bookingData.subServiceType || 'airbnb';
          const serviceTypeMap: Record<string, string> = {
            'airbnb': 'Airbnb Cleaning',
            'domestic': 'Domestic Cleaning',
            'commercial': 'Commercial Cleaning',
            'carpet': 'Carpet Cleaning',
            'end-of-tenancy': 'End of Tenancy Cleaning',
          };
          return serviceTypeMap[subType] || subType;
        })(),
        // cleaning_type: For Airbnb = type of cleaning (checkin-checkout, midstay), For others = frequency or specific type
        cleaning_type: bookingData.serviceType || 'checkin-checkout',
        frequently: bookingData.serviceFrequency || 'onetime', // Default to onetime
        
        // Dates - stored as London time without timezone conversion
        date_time: bookingDateTimeStr || null,
        date_only: dateStr || null,
        time_only: (bookingData.flexibility === 'flexible-time' || !bookingData.selectedTime) 
          ? null 
          : time24ForDB, // Use the converted 24-hour format for DB TIME field
        
        // Hours
        hours_required: bookingData.estimatedHours || 0, // system calculated
        total_hours: totalHours || 0, // actual hours
        cleaning_cost_per_hour: bookingData.hourlyRate || 0,
        total_cost: Math.round((bookingData.totalCost || 0) * 100) / 100, // Round to 2 decimal places
        
        // Payment - use Stripe if customer has saved cards, otherwise use provided method or null
        payment_method: bookingData.paymentMethod || (hasPaymentMethods ? 'Stripe' : null),
        payment_status: 'Unpaid',
        booking_status: 'active',
        
        // Cleaner - set if provided, otherwise null (no default value)
        cleaner: bookingData.cleanerId && bookingData.cleanerId > 0 ? bookingData.cleanerId : null,
        cleaner_percentage: null,
        
        // Access
        access: bookingData.propertyAccess || null,
        
        // Additional details (JSON with service, schedule, access info)
        additional_details: buildAdditionalDetails(bookingData),
        
        // Tracking - who created this booking
        created_by_user_id: createdByUserId,
        created_by_source: createdBySource
      };

      // Conditional fields - only add if they have values
      if (bookingDateTimeStr && totalHours > 0) {
        bookingInsert.end_date_time = calculateEndDateTime(bookingDateTimeStr, totalHours);
      }

      if (bookingData.alreadyCleaned === false) {
        bookingInsert.first_cleaning = 'No';
      } else if (bookingData.alreadyCleaned === true) {
        bookingInsert.first_cleaning = 'Yes';
      }

      if (bookingData.ovenType && bookingData.ovenType !== 'dontneed' && bookingData.ovenType !== '') {
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

      // Simple insert - let the database auto-generate the ID
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingInsert)
        .select('id')
        .single();
      
      if (bookingError || !booking) {
        console.error('Booking insert failed:', bookingError, { bookingInsert });
        throw new Error(bookingError?.message || 'Failed to create booking');
      }

      // Insert primary cleaner into cleaner_payments if assigned
      if (bookingData.cleanerId && bookingData.cleanerId > 0) {
        try {
          // Calculate cleaner pay based on total cost and default percentage (or cleaner's rate)
          const cleanerPercentage = 50; // Default 50%, can be adjusted
          const calculatedPay = (bookingData.totalCost || 0) * (cleanerPercentage / 100);
          
          await supabase.from('cleaner_payments').insert({
            booking_id: booking.id,
            cleaner_id: bookingData.cleanerId,
            is_primary: true,
            payment_type: 'percentage',
            percentage_rate: cleanerPercentage,
            hours_assigned: totalHours,
            calculated_pay: calculatedPay,
            status: 'assigned'
          });
          console.log('[useAirbnbBookingSubmit] Created cleaner_payments entry for primary cleaner');
        } catch (cleanerError) {
          console.error('[useAirbnbBookingSubmit] Failed to create cleaner_payments entry:', cleanerError);
          // Don't fail the booking if this fails
        }
      }

      // Log booking creation to activity_logs
      try {
        const serviceTypeForLog = (() => {
          const subType = bookingData.subServiceType || 'airbnb';
          const serviceTypeMap: Record<string, string> = {
            'airbnb': 'Airbnb Cleaning',
            'domestic': 'Domestic Cleaning',
            'commercial': 'Commercial Cleaning',
            'carpet': 'Carpet Cleaning',
            'end-of-tenancy': 'End of Tenancy Cleaning',
          };
          return serviceTypeMap[subType] || subType;
        })();
        
        await supabase.from('activity_logs').insert({
          action_type: 'booking_created',
          entity_type: 'booking',
          entity_id: booking.id.toString(),
          user_role: 'admin',
          details: {
            booking_id: booking.id,
            customer_name: `${bookingData.firstName} ${bookingData.lastName}`,
            customer_email: bookingData.email,
            booking_date: bookingDateTimeStr,
            service_type: serviceTypeForLog,
            address: `${addressForBooking}, ${postcodeForBooking}`
          }
        });
      } catch (logError) {
        console.error('Failed to log booking creation:', logError);
        // Don't fail the booking if logging fails
      }

      // Create recurring service for recurring domestic bookings
      const isRecurring = bookingData.serviceFrequency && 
        bookingData.serviceFrequency !== 'onetime' && 
        bookingData.serviceFrequency !== 'one-time';
      const isDomestic = bookingData.subServiceType === 'domestic' || 
        bookingData.subServiceType === 'Domestic';
      
      if (isRecurring && isDomestic) {
        console.log('[useAirbnbBookingSubmit] Creating recurring service for domestic booking');
        
        try {
          // Generate recurring group ID
          const recurringGroupId = crypto.randomUUID();
          
          // Determine interval based on frequency
          let interval = '7'; // Default to weekly
          if (bookingData.serviceFrequency === 'fortnightly' || bookingData.serviceFrequency === 'biweekly') {
            interval = '14';
          } else if (bookingData.serviceFrequency === 'monthly') {
            interval = '30';
          }

          // Map day of week from selected date
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

          // Use weeklyCost from quote if available, otherwise calculate
          const regularHours = bookingData.estimatedHours || 0;
          const recurringCost = bookingData.weeklyCost || (regularHours * (bookingData.hourlyRate || 0));
          const costPerHour = bookingData.weeklyCost && regularHours > 0 
            ? bookingData.weeklyCost / regularHours 
            : (bookingData.hourlyRate || 0);

          const recurringServiceData = {
            customer: customerId,
            address: addressIdForRecurring || addressForBooking,
            cleaner: bookingData.cleanerId && bookingData.cleanerId > 0 ? bookingData.cleanerId : null,
            cleaner_rate: null,
            cleaning_type: 'Domestic',
            frequently: bookingData.serviceFrequency,
            days_of_the_week: dayOfWeek,
            hours: String(regularHours),
            cost_per_hour: costPerHour,
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
            console.error('[useAirbnbBookingSubmit] Failed to create recurring service:', recurringError);
          } else {
            console.log('[useAirbnbBookingSubmit] Recurring service created successfully');
            
            // Update booking with recurring group ID
            await supabase
              .from('bookings')
              .update({ recurring_group_id: recurringGroupId })
              .eq('id', booking.id);
          }
        } catch (recurringError) {
          console.error('[useAirbnbBookingSubmit] Error creating recurring service:', recurringError);
          // Don't fail the booking if recurring service creation fails
        }
      }

      // Note: Confirmation email is now handled automatically by the notification trigger system
      // (trigger_event: 'booking_created') to avoid duplicate emails

      // Step 3a: Send bank transfer SMS if payment method is bank transfer
      if (bookingData.paymentMethod === 'bank-transfer' && bookingData.phone) {
        console.log('[useAirbnbBookingSubmit] Sending bank transfer SMS for booking:', booking.id);
        try {
          const bookingDateFormatted = bookingData.selectedDate 
            ? new Date(bookingData.selectedDate).toLocaleDateString('en-GB', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })
            : 'your scheduled date';
          
          const { error: smsError } = await supabase.functions.invoke('send-bank-transfer-sms', {
            body: {
              bookingId: booking.id,
              phoneNumber: bookingData.phone,
              customerName: bookingData.firstName || 'Customer',
              amount: bookingData.totalCost || 0,
              bookingDate: bookingDateFormatted
            }
          });

          if (smsError) {
            console.error('[useAirbnbBookingSubmit] Failed to send bank transfer SMS:', smsError);
            // Don't fail the booking if SMS fails
          } else {
            console.log('[useAirbnbBookingSubmit] Bank transfer SMS sent successfully');
          }
        } catch (smsError) {
          console.error('[useAirbnbBookingSubmit] Error sending bank transfer SMS:', smsError);
          // Don't fail the booking if SMS fails
        }
      }

      // Step 3b: Authorize payment only if not skipped (for non-urgent bookings) and not bank transfer
      if (!skipPaymentAuth && bookingData.paymentMethod !== 'bank-transfer') {
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
