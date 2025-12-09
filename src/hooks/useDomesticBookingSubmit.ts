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
  
  notes: string;
  additionalDetails?: any;
  cleanerId?: number;
  paymentMethod?: string;
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

const calculateEndDateTime = (startDateTime: Date, hours: number): string => {
  const endDate = new Date(startDateTime);
  endDate.setHours(endDate.getHours() + Math.floor(hours));
  endDate.setMinutes(endDate.getMinutes() + ((hours % 1) * 60));
  return endDate.toISOString();
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

      let bookingDateTime = null;
      let time24ForDB: string | null = null;
      
      if (bookingData.selectedDate && bookingData.selectedTime) {
        try {
          const dateObj = bookingData.selectedDate instanceof Date 
            ? bookingData.selectedDate 
            : new Date(bookingData.selectedDate);
          
          if (!isNaN(dateObj.getTime())) {
            const dateStr = dateObj.toISOString().split('T')[0];
            
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
            bookingDateTime = new Date(`${dateStr}T${time24}:00`);
            
            if (isNaN(bookingDateTime.getTime())) {
              bookingDateTime = null;
              time24ForDB = null;
            }
          }
        } catch (error) {
          console.error('Error creating booking datetime:', error);
          bookingDateTime = null;
          time24ForDB = null;
        }
      }

      const totalHours = bookingData.totalHours || bookingData.estimatedHours || 0;

      const { data: latestBooking } = await supabase
        .from('bookings')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .single();
      const nextId = (latestBooking?.id ?? 0) + 1;

      const bookingInsert: any = {
        id: nextId,
        customer: customerId,
        first_name: bookingData.firstName || '',
        last_name: bookingData.lastName || '',
        email: bookingData.email || '',
        phone_number: bookingData.phone || '',
        
        address: addressForBooking || '',
        postcode: postcodeForBooking || '',
        
        property_details: buildPropertyDetails(bookingData),
        
        service_type: 'domestic',
        cleaning_type: bookingData.serviceFrequency || 'onetime',
        frequently: bookingData.serviceFrequency || 'onetime',
        
        date_time: bookingDateTime?.toISOString() || null,
        date_only: bookingData.selectedDate 
          ? (bookingData.selectedDate instanceof Date 
              ? bookingData.selectedDate.toISOString().split('T')[0] 
              : new Date(bookingData.selectedDate).toISOString().split('T')[0])
          : null,
        time_only: (bookingData.flexibility === 'flexible-time' || !bookingData.selectedTime) 
          ? null 
          : time24ForDB,
        
        hours_required: bookingData.estimatedHours || 0,
        total_hours: totalHours || 0,
        cleaning_cost_per_hour: bookingData.hourlyRate || 0,
        total_cost: bookingData.totalCost || 0,
        
        payment_method: bookingData.paymentMethod || (hasPaymentMethods ? 'Stripe' : null),
        payment_status: 'Unpaid',
        booking_status: 'active',
        
        cleaner: bookingData.cleanerId && bookingData.cleanerId > 0 ? bookingData.cleanerId : null,
        cleaner_percentage: null,
        
        access: bookingData.propertyAccess || null,
        
        additional_details: buildAdditionalDetails(bookingData)
      };

      if (bookingDateTime && totalHours > 0) {
        bookingInsert.end_date_time = calculateEndDateTime(bookingDateTime, totalHours);
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

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingInsert)
        .select('id')
        .single();

      if (bookingError || !booking) {
        console.error('Create booking failed:', bookingError);
        throw new Error(bookingError?.message || 'Failed to create booking');
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
      
      // Queue SMS reminder if customer has no payment methods
      if (!hasPaymentMethods && bookingData.totalCost > 0 && bookingData.phone) {
        try {
          // Generate payment collection link first
          const { data: paymentLinkResult } = await supabase.functions.invoke('stripe-collect-payment-method', {
            body: {
              customer_id: customerId,
              email: bookingData.email,
              name: `${bookingData.firstName} ${bookingData.lastName}`.trim() || 'Customer',
              return_url: `https://account.sncleaningservices.co.uk/welcome?customer_id=${customerId}&payment_setup=success`,
              collect_only: true,
              send_email: false
            }
          });

          const paymentLink = paymentLinkResult?.checkoutUrl || paymentLinkResult?.url || '';
          
          if (paymentLink) {
            // Schedule SMS for 5 minutes from now
            const sendAt = new Date();
            sendAt.setMinutes(sendAt.getMinutes() + 5);

            await supabase.from('sms_reminders_queue').insert({
              booking_id: booking.id,
              phone_number: bookingData.phone,
              customer_name: `${bookingData.firstName} ${bookingData.lastName}`,
              amount: bookingData.totalCost,
              payment_link: paymentLink,
              send_at: sendAt.toISOString(),
              status: 'pending',
              message_type: 'payment_method_collection'
            });
            
            console.log('SMS reminder queued for 5 minutes from now');
          }
        } catch (smsQueueError) {
          console.error('Failed to queue SMS reminder:', smsQueueError);
          // Don't fail the booking creation if SMS queuing fails
        }
      }

      toast({
        title: 'Booking Created!',
        description: `Your domestic cleaning booking has been confirmed.`,
      });

      return { success: true, bookingId: booking.id };
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