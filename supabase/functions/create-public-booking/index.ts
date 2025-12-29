import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreatePublicBookingRequest {
  // Customer details
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Address
  houseNumber?: string;
  street?: string;
  postcode: string;
  city?: string;
  addressId?: string;
  
  // Property details
  propertyType?: string;
  bedrooms?: string;
  bathrooms?: string;
  toilets?: string;
  numberOfFloors?: number;
  additionalRooms?: Record<string, number>;
  propertyFeatures?: Record<string, boolean>;
  
  // Service details
  serviceType?: string;
  cleaningType?: string;
  serviceFrequency?: string;
  ovenType?: string;
  
  // Schedule
  selectedDate?: string;
  selectedTime?: string;
  flexibility?: string;
  shortNoticeCharge?: number;
  
  // Access
  propertyAccess?: string;
  accessNotes?: string;
  
  // Costs
  totalCost: number;
  estimatedHours?: number;
  totalHours?: number;
  hourlyRate?: number;
  weeklyCost?: number;
  
  // Notes
  notes?: string;
  additionalDetails?: any;
  
  // Payment
  paymentMethod?: string;
  
  // Agent attribution
  agentUserId?: string;
  
  // First deep clean
  wantsFirstDeepClean?: boolean;
  firstDeepCleanExtraHours?: number;
  firstDeepCleanHours?: number;
  firstDeepCleanCost?: number;
  regularRecurringCost?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const data: CreatePublicBookingRequest = await req.json();
    
    console.log('[create-public-booking] Received data:', {
      email: data.email,
      firstName: data.firstName,
      totalCost: data.totalCost,
      paymentMethod: data.paymentMethod,
      // Deep clean hours tracking
      wantsFirstDeepClean: data.wantsFirstDeepClean,
      firstDeepCleanExtraHours: data.firstDeepCleanExtraHours,
      estimatedHours: data.estimatedHours,
      totalHours: data.totalHours,
      firstDeepCleanHours: data.firstDeepCleanHours
    });

    // Step 1: Find or create customer
    let customerId: number;
    
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('email', data.email)
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.id;
      console.log('[create-public-booking] Found existing customer:', customerId);
      
      // Update status to Current
      await supabaseAdmin
        .from('customers')
        .update({ client_status: 'Current' })
        .eq('id', customerId);
    } else {
      const { data: newCustomer, error: customerError } = await supabaseAdmin
        .from('customers')
        .insert({
          first_name: data.firstName,
          last_name: data.lastName,
          full_name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
          client_status: 'New'
        })
        .select('id')
        .single();

      if (customerError || !newCustomer) {
        console.error('[create-public-booking] Customer creation error:', customerError);
        throw new Error(customerError?.message || 'Failed to create customer');
      }
      customerId = newCustomer.id;
      console.log('[create-public-booking] Created new customer:', customerId);
    }

    // Step 2: Create or use existing address
    let addressForBooking = data.street 
      ? `${data.houseNumber || ''} ${data.street}${data.city ? ', ' + data.city : ''}`.trim()
      : data.postcode;
    
    if (data.addressId) {
      const { data: addressData } = await supabaseAdmin
        .from('addresses')
        .select('address, postcode')
        .eq('id', data.addressId)
        .single();
      
      if (addressData) {
        addressForBooking = addressData.address;
      }
    } else if (data.street) {
      // Try to create address
      try {
        await supabaseAdmin
          .from('addresses')
          .insert({
            customer_id: customerId,
            address: addressForBooking,
            postcode: data.postcode,
            is_default: false
          });
      } catch (addressError) {
        console.log('[create-public-booking] Note: Could not create address record:', addressError);
      }
    }

    // Step 3: Build booking data
    let bookingDateTimeStr: string | null = null;
    let time24ForDB: string | null = null;
    let dateStr: string | null = null;

    if (data.selectedDate) {
      try {
        const d = new Date(data.selectedDate);
        dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        if (data.selectedTime) {
          let time24 = data.selectedTime;
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
          bookingDateTimeStr = `${dateStr}T${time24}:00+00:00`;
        } else {
          bookingDateTimeStr = `${dateStr}T09:00:00+00:00`;
        }
      } catch (error) {
        console.error('[create-public-booking] Error creating booking datetime:', error);
      }
    }

    // Build property details JSON
    const propertyDetails: Record<string, any> = {
      type: data.propertyType || 'flat',
      bedrooms: data.bedrooms || '1',
      bathrooms: data.bathrooms || '1',
    };
    if (data.toilets) propertyDetails.toilets = data.toilets;
    if (data.numberOfFloors && data.numberOfFloors > 0) propertyDetails.numberOfFloors = data.numberOfFloors;
    if (data.additionalRooms) propertyDetails.additionalRooms = data.additionalRooms;
    if (data.propertyFeatures) propertyDetails.propertyFeatures = data.propertyFeatures;

    // Build additional details JSON
    const additionalDetailsJson: Record<string, any> = {
      serviceFrequency: data.serviceFrequency || 'onetime',
    };
    if (data.wantsFirstDeepClean) {
      additionalDetailsJson.firstDeepClean = {
        enabled: true,
        extraHours: data.firstDeepCleanExtraHours || 0,
        hours: data.firstDeepCleanHours || 0,
        cost: data.firstDeepCleanCost || 0,
        regularRecurringCost: data.regularRecurringCost || 0,
      };
    }
    if (data.ovenType && data.ovenType !== 'dontneed' && data.ovenType !== '') {
      additionalDetailsJson.ovenCleaning = { needed: true, type: data.ovenType };
    }
    if (data.flexibility) additionalDetailsJson.flexibility = data.flexibility;
    if (data.shortNoticeCharge && data.shortNoticeCharge > 0) additionalDetailsJson.shortNoticeCharge = data.shortNoticeCharge;
    additionalDetailsJson.access = { 
      method: data.propertyAccess || 'customer-home', 
      notes: data.accessNotes || '' 
    };
    if (data.notes) additionalDetailsJson.notes = data.notes;

    // Calculate hours correctly for first deep clean
    const regularHours = data.estimatedHours || data.totalHours || 0;
    const firstDeepCleanExtraHours = data.firstDeepCleanExtraHours || 0;
    
    // For the FIRST booking with deep clean, total hours should include extra deep clean hours
    // e.g., 2 regular hours + 1 extra hour = 3 hours for first visit
    // Use firstDeepCleanHours directly if provided (most accurate), otherwise calculate
    let totalHoursForBooking: number;
    if (data.wantsFirstDeepClean) {
      // If firstDeepCleanHours is explicitly provided, use it directly (most accurate)
      if (data.firstDeepCleanHours && data.firstDeepCleanHours > 0) {
        totalHoursForBooking = data.firstDeepCleanHours;
      } else {
        // Fallback to calculating from regular hours + extra hours
        totalHoursForBooking = regularHours + firstDeepCleanExtraHours;
      }
    } else {
      totalHoursForBooking = regularHours;
    }
    
    console.log('[create-public-booking] Hours calculation:', {
      regularHours,
      firstDeepCleanExtraHours,
      firstDeepCleanHours: data.firstDeepCleanHours,
      wantsFirstDeepClean: data.wantsFirstDeepClean,
      totalHoursForBooking
    });

    // Determine created_by_source
    let createdBySource = 'website';
    let createdByUserId: string | null = null;
    if (data.agentUserId) {
      createdByUserId = data.agentUserId;
      createdBySource = 'sales_agent';
    }

    // Check if this is a recurring booking
    const isRecurring = data.serviceFrequency && 
      data.serviceFrequency !== 'onetime' && 
      data.serviceFrequency !== 'one-time';
    
    const recurringGroupId = isRecurring ? crypto.randomUUID() : null;

    // Step 4: Create booking
    const bookingInsert: Record<string, any> = {
      customer: customerId,
      first_name: data.firstName || '',
      last_name: data.lastName || '',
      email: data.email || '',
      phone_number: data.phone || '',
      address: addressForBooking || '',
      postcode: data.postcode || '',
      property_details: JSON.stringify(propertyDetails),
      service_type: data.serviceType || 'Domestic',
      cleaning_type: (data.wantsFirstDeepClean || data.serviceFrequency === 'onetime') ? 'Deep Cleaning' : (data.cleaningType || 'Standard Cleaning'),
      frequently: data.serviceFrequency || 'onetime',
      date_time: bookingDateTimeStr || null,
      date_only: dateStr || null,
      time_only: (data.flexibility === 'flexible-time' || !data.selectedTime) ? null : time24ForDB,
      hours_required: totalHoursForBooking,
      total_hours: totalHoursForBooking,
      recommended_hours: regularHours,  // Regular hours for recurring bookings
      cleaning_cost_per_hour: data.hourlyRate || 0,
      total_cost: data.totalCost || 0,
      payment_method: data.paymentMethod || null,
      payment_status: 'Unpaid',
      booking_status: 'active',
      access: data.propertyAccess || null,
      additional_details: JSON.stringify(additionalDetailsJson),
      created_by_user_id: createdByUserId,
      created_by_source: createdBySource,
      send_notification_email: true
    };

    if (recurringGroupId) {
      bookingInsert.recurring_group_id = recurringGroupId;
    }

    if (data.ovenType && data.ovenType !== 'dontneed' && data.ovenType !== '') {
      bookingInsert.oven_size = data.ovenType;
    }

    console.log('[create-public-booking] Inserting booking:', bookingInsert);

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert(bookingInsert)
      .select('id')
      .single();

    if (bookingError || !booking) {
      console.error('[create-public-booking] Booking creation error:', bookingError);
      throw new Error(bookingError?.message || 'Failed to create booking');
    }

    console.log('[create-public-booking] Created booking:', booking.id);

    // Step 5: Create recurring service if applicable
    if (isRecurring && recurringGroupId && dateStr) {
      let interval = '7';
      if (data.serviceFrequency === 'fortnightly' || data.serviceFrequency === 'biweekly' || data.serviceFrequency === 'bi-weekly') {
        interval = '14';
      } else if (data.serviceFrequency === 'monthly') {
        interval = '30';
      }

      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dateObj = new Date(data.selectedDate!);
      const dayOfWeek = days[dateObj.getDay()];

      // Get or create address ID for recurring service
      let addressIdForRecurring: string | null = data.addressId || null;
      if (!addressIdForRecurring && addressForBooking) {
        const { data: existingAddress } = await supabaseAdmin
          .from('addresses')
          .select('id')
          .eq('customer_id', customerId)
          .eq('address', addressForBooking)
          .maybeSingle();
        
        if (existingAddress) {
          addressIdForRecurring = existingAddress.id;
        } else {
          const { data: newAddress } = await supabaseAdmin
            .from('addresses')
            .insert({
              customer_id: customerId,
              address: addressForBooking,
              postcode: data.postcode,
              is_default: false
            })
            .select('id')
            .single();
          
          if (newAddress) {
            addressIdForRecurring = newAddress.id;
          }
        }
      }

      const recurringCost = data.regularRecurringCost || (regularHours * (data.hourlyRate || 0));

      const recurringServiceData = {
        customer: customerId,
        address: addressIdForRecurring || addressForBooking,
        cleaner: null,
        cleaner_rate: null,
        cleaning_type: 'Domestic',
        frequently: data.serviceFrequency,
        days_of_the_week: dayOfWeek,
        hours: String(regularHours),
        cost_per_hour: data.hourlyRate || 0,
        total_cost: recurringCost,
        payment_method: data.paymentMethod || null,
        start_date: dateStr || null,
        start_time: time24ForDB ? `${time24ForDB}:00+00` : null,
        postponed: false,
        interval: interval,
        recurring_group_id: recurringGroupId,
        created_by_user_id: createdByUserId,
        created_by_source: createdBySource
      };

      const { error: recurringError } = await supabaseAdmin
        .from('recurring_services')
        .insert([recurringServiceData]);

      if (recurringError) {
        console.error('[create-public-booking] Failed to create recurring service:', recurringError);
      } else {
        console.log('[create-public-booking] Recurring service created successfully');
      }
    }

    return new Response(JSON.stringify({
      success: true,
      bookingId: booking.id,
      customerId: customerId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[create-public-booking] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);
