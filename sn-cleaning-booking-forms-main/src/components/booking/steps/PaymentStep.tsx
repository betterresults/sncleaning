import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { BookingData } from '../AirbnbBookingForm';
import { CreditCard, Shield, Loader2, AlertTriangle, Building2, Clock, ChevronDown, ChevronUp, Check, Pencil, MapPin, User as UserIcon, Calendar, Home } from 'lucide-react';
import { useAirbnbBookingSubmit } from '@/hooks/useAirbnbBookingSubmit';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { CardNumberElement, CardExpiryElement, CardCvcElement, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import CustomerSelector from '@/components/booking/CustomerSelector';
import AddressSelector from '@/components/booking/AddressSelector';
import { usePaymentMethodCheck } from '@/hooks/usePaymentMethodCheck';
import { useAdminCustomer } from '@/contexts/AdminCustomerContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';

// Simple auth check without using AuthContext
const useSimpleAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      if (session?.user) {
        // Check if user has a customer profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('customer_id')
          .eq('user_id', session.user.id)
          .single();
        
        const customerIdValue = profile?.customer_id;
        setCustomerId(customerIdValue);
        
        // Only fetch payment methods if user is a customer
        if (customerIdValue) {
          const { data } = await supabase
            .from('customer_payment_methods')
            .select('*')
            .eq('customer_id', customerIdValue)
            .order('created_at', { ascending: false });
          setPaymentMethods(data || []);
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  return { user, customerId, paymentMethods, loading };
};

// Validation schemas
const emailSchema = z.string().email('Please enter a valid email address');
const ukPhoneSchema = z.string().regex(/^\+44\d{10}$/, 'UK phone must be +44 followed by 10 digits');

// PaymentElement wrapper component with its own Elements context
interface PaymentElementWrapperProps {
  clientSecret: string;
  stripePromise: Promise<any> | null;
  onReady: () => void;
  onComplete: (complete: boolean) => void;
  isUrgentBooking: boolean;
  totalCost: number;
}

const PaymentElementWrapper: React.FC<PaymentElementWrapperProps> = ({ 
  clientSecret, 
  stripePromise,
  onReady,
  onComplete,
  isUrgentBooking,
  totalCost
}) => {
  if (!stripePromise) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-gray-600">Loading payment...</span>
      </div>
    );
  }

  return (
    <Elements 
      stripe={stripePromise} 
      options={{ 
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#185166',
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            colorDanger: '#ef4444',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            borderRadius: '12px',
          },
        },
      }}
    >
      <PaymentElementInner 
        onReady={onReady} 
        onComplete={onComplete}
        isUrgentBooking={isUrgentBooking}
        totalCost={totalCost}
      />
    </Elements>
  );
};

// Inner component that uses PaymentElement hooks
const PaymentElementInner: React.FC<{
  onReady: () => void;
  onComplete: (complete: boolean) => void;
  isUrgentBooking: boolean;
  totalCost: number;
}> = ({ onReady, onComplete, isUrgentBooking, totalCost }) => {
  return (
    <div className="min-h-[200px]">
      <PaymentElement 
        options={{
          layout: {
            type: 'accordion',
            defaultCollapsed: false,
            radios: false,
            spacedAccordionItems: true,
          },
          paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
          business: { name: 'SN Cleaning Services' },
        }}
        onReady={onReady}
        onChange={(e) => onComplete(e.complete)}
      />
    </div>
  );
};

interface PaymentStepProps {
  data: BookingData | any;
  onUpdate: (updates: Partial<BookingData> | any) => void;
  onBack: () => void;
  isAdminMode?: boolean;
  isQuoteLinkMode?: boolean;
  formType?: 'airbnb' | 'linen';
  bookingSummary?: React.ReactNode;
  onBookingAttempt?: () => void;
  onBookingSuccess?: (bookingId: number) => void;
  stripePromise?: Promise<any> | null;
}

const PaymentStep: React.FC<PaymentStepProps> = ({ 
  data, 
  onUpdate, 
  onBack, 
  isAdminMode = false, 
  isQuoteLinkMode = false,
  formType = 'airbnb',
  bookingSummary,
  onBookingAttempt,
  onBookingSuccess,
  stripePromise
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, customerId, paymentMethods: userPaymentMethods, loading: loadingPaymentMethods } = useSimpleAuth();
  const { submitBooking, loading: submitting } = useAirbnbBookingSubmit();
  const [processing, setProcessing] = useState(false);
  const [searchParams] = useSearchParams();
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const stripe = useStripe();
  const elements = useElements();
  const [cardComplete, setCardComplete] = useState(false);
  const [companyPaymentMethods, setCompanyPaymentMethods] = useState<string[]>([]);
  const [selectedAdminPaymentMethod, setSelectedAdminPaymentMethod] = useState<string>('');
  const [adminCustomerPaymentMethods, setAdminCustomerPaymentMethods] = useState<any[]>([]);
  const [editDetails, setEditDetails] = useState(false);
  const [cleaners, setCleaners] = useState<any[]>([]);
  const [paymentType, setPaymentType] = useState<'card' | 'bank-transfer'>('card');
  const location = useLocation();
  
  // Setup Intent state for PaymentElement
  const [setupIntentClientSecret, setSetupIntentClientSecret] = useState<string | null>(null);
  const [loadingSetupIntent, setLoadingSetupIntent] = useState(false);
  const [paymentElementReady, setPaymentElementReady] = useState(false);
  
  // Guest customer lookup by email
  const [guestCustomerId, setGuestCustomerId] = useState<number | null>(null);
  const [guestPaymentMethods, setGuestPaymentMethods] = useState<any[]>([]);
  const [guestCustomerName, setGuestCustomerName] = useState<string | null>(null);
  const [checkingGuestCustomer, setCheckingGuestCustomer] = useState(false);
  const [useGuestSavedCard, setUseGuestSavedCard] = useState(true);
  
  // Collapsible states for quote link mode - start collapsed if data is pre-filled
  const [detailsOpen, setDetailsOpen] = useState(!isQuoteLinkMode || !data.firstName);
  const [addressOpen, setAddressOpen] = useState(!isQuoteLinkMode || !data.street);

  // Determine subServiceType based on current route
  const subServiceType = useMemo(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/domestic')) return 'domestic';
    if (path.includes('/commercial')) return 'commercial';
    return 'airbnb'; // default
  }, [location.pathname]);

// Use admin-selected customerId or logged-in/selected customerId
const { selectedCustomerId } = useAdminCustomer();
const effectiveCustomerId = isAdminMode ? data.customerId : (customerId || selectedCustomerId || null);

// In admin mode, use admin customer payment methods; otherwise use logged-in user's
const paymentMethods = isAdminMode ? adminCustomerPaymentMethods : userPaymentMethods;

console.log('[PaymentStep] ID context', { isAdminMode, customerId, selectedCustomerId, effectiveCustomerId });
const { hasPaymentMethods, loading: checkingPaymentMethods } = usePaymentMethodCheck(effectiveCustomerId || null);
  
// Admin testing mode - skip payment if URL has ?adminTest=true
const adminTestMode = searchParams.get('adminTest') === 'true';

// Fetch payment methods for admin-selected customer
useEffect(() => {
  if (isAdminMode && effectiveCustomerId) {
    const fetchAdminCustomerPaymentMethods = async () => {
      console.log('[PaymentStep] Fetching payment methods for customer:', effectiveCustomerId);
      const { data, error } = await supabase
        .from('customer_payment_methods')
        .select('*')
        .eq('customer_id', effectiveCustomerId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[PaymentStep] Error fetching payment methods:', error);
        setAdminCustomerPaymentMethods([]);
      } else {
        console.log('[PaymentStep] Fetched payment methods:', data);
        setAdminCustomerPaymentMethods(data || []);
      }
    };
    fetchAdminCustomerPaymentMethods();
  } else if (isAdminMode) {
    // Reset if no customer selected
    setAdminCustomerPaymentMethods([]);
  }
}, [isAdminMode, effectiveCustomerId]);

// Auto-fill logged-in or selected customer data on mount
useEffect(() => {
  if (!isAdminMode && effectiveCustomerId && (!data.firstName || !data.email || !data.phone)) {
    console.log('[PaymentStep] Prefill condition met', {
      effectiveCustomerId,
      hasNames: !!data.firstName,
      hasEmail: !!data.email,
      hasPhone: !!data.phone,
    });
    const fetchCustomerData = async () => {
      const { data: customerData, error } = await supabase
        .from('customers')
        .select('first_name, last_name, email, phone')
        .eq('id', effectiveCustomerId)
        .single();
      
      if (error) {
        console.error('[PaymentStep] Prefill fetch error', error);
        return;
      }
      
      if (customerData) {
        onUpdate({
          firstName: customerData.first_name || '',
          lastName: customerData.last_name || '',
          email: customerData.email || '',
          phone: customerData.phone || '',
          // Ensure booking data knows the customer in customer mode
          customerId: data.customerId ?? effectiveCustomerId,
        });
      }
    };
    fetchCustomerData();
  }
}, [effectiveCustomerId, isAdminMode]);
  
  // Fetch company payment methods from settings (for admin mode)
  useEffect(() => {
    if (isAdminMode) {
      const fetchCompanyPaymentMethods = async () => {
        const { data: settings, error } = await supabase
          .from('company_settings')
          .select('setting_value')
          .eq('setting_category', 'payment')
          .eq('setting_key', 'methods')
          .single();
        
        console.log('[PaymentStep] Payment methods settings:', { settings, error });
        
        if (settings?.setting_value) {
          let methods: string[] = [];
          
          // Handle different data formats
          if (Array.isArray(settings.setting_value)) {
            methods = settings.setting_value as string[];
          } else if (typeof settings.setting_value === 'object' && settings.setting_value !== null) {
            // If it's an object with a methods array
            methods = (settings.setting_value as any).methods || [];
          } else if (typeof settings.setting_value === 'string') {
            // If it's a JSON string, parse it
            try {
              const parsed = JSON.parse(settings.setting_value);
              methods = Array.isArray(parsed) ? parsed : (parsed.methods || []);
            } catch (e) {
              console.error('[PaymentStep] Failed to parse payment methods:', e);
            }
          }
          
          console.log('[PaymentStep] Parsed payment methods:', methods);
          setCompanyPaymentMethods(methods);
        }
      };
      fetchCompanyPaymentMethods();
    }
  }, [isAdminMode]);

  // Fetch cleaners list
  useEffect(() => {
    const fetchCleaners = async () => {
      const { data: cleanersData, error } = await supabase
        .from('cleaners')
        .select('id, first_name, last_name, full_name')
        .order('first_name', { ascending: true });
      
      if (!error && cleanersData) {
        setCleaners(cleanersData);
      }
    };
    fetchCleaners();
  }, []);

  // Get default payment method if available (only for logged-in customers or admin-selected)
  const defaultPaymentMethod = effectiveCustomerId && paymentMethods.length > 0 
    ? (paymentMethods.find((pm: any) => pm.is_default) || paymentMethods[0])
    : null;

  // Calculate if booking is urgent (within 48 hours)
  const isUrgentBooking = useMemo(() => {
    if (!data.selectedDate || !data.selectedTime) return false;
    
    const bookingDateTime = new Date(
      `${data.selectedDate.toISOString().split('T')[0]}T${data.selectedTime}:00`
    );
    const hoursUntilBooking = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntilBooking <= 48;
  }, [data.selectedDate, data.selectedTime]);

  // Bank transfer is available for all customers
  const canUseBankTransfer = !isAdminMode;

  // Check for existing customer by email (for guest users) - uses edge function to bypass RLS
  useEffect(() => {
    // Skip if logged in, admin mode, or no valid email
    if (user || isAdminMode || !data.email) {
      setGuestCustomerId(null);
      setGuestPaymentMethods([]);
      setGuestCustomerName(null);
      return;
    }
    
    // Validate email format
    const emailResult = emailSchema.safeParse(data.email);
    if (!emailResult.success) {
      return;
    }
    
    const checkExistingCustomer = async () => {
      setCheckingGuestCustomer(true);
      try {
        // Use edge function to look up customer by email (bypasses RLS for guest users)
        const { data: lookupResult, error: lookupError } = await supabase.functions.invoke('lookup-customer-by-email', {
          body: { email: data.email }
        });
        
        if (lookupError) {
          console.error('[PaymentStep] Error looking up customer:', lookupError);
          setGuestCustomerId(null);
          setGuestPaymentMethods([]);
          setGuestCustomerName(null);
          return;
        }
        
        if (lookupResult?.found && lookupResult.customer?.id) {
          // Existing customer found
          console.log('[PaymentStep] Found existing customer by email:', lookupResult.customer.id, lookupResult.customer);
          setGuestCustomerId(lookupResult.customer.id);
          
          // Store customer name for welcome message
          const customerName = lookupResult.customer.fullName || 
            [lookupResult.customer.firstName, lookupResult.customer.lastName].filter(Boolean).join(' ') ||
            null;
          setGuestCustomerName(customerName);
          
          // Auto-fill name and phone if not already filled
          if (lookupResult.customer.firstName && !data.firstName) {
            onUpdate({ firstName: lookupResult.customer.firstName });
          }
          if (lookupResult.customer.lastName && !data.lastName) {
            onUpdate({ lastName: lookupResult.customer.lastName });
          }
          if (lookupResult.customer.phone && !data.phone) {
            onUpdate({ phone: lookupResult.customer.phone });
          }
          
          // Use payment methods from the lookup result
          if (lookupResult.paymentMethods && lookupResult.paymentMethods.length > 0) {
            console.log('[PaymentStep] Found saved payment methods for guest:', lookupResult.paymentMethods.length);
            setGuestPaymentMethods(lookupResult.paymentMethods);
            setUseGuestSavedCard(true);
          } else {
            setGuestPaymentMethods([]);
          }
        } else {
          // No customer found - will create when they add a card
          console.log('[PaymentStep] No existing customer found for email:', data.email);
          setGuestCustomerId(null);
          setGuestPaymentMethods([]);
          setGuestCustomerName(null);
        }
      } catch (err) {
        console.error('[PaymentStep] Error checking customer:', err);
      } finally {
        setCheckingGuestCustomer(false);
      }
    };
    
    // Debounce the check
    const timeoutId = setTimeout(checkExistingCustomer, 800);
    return () => clearTimeout(timeoutId);
  }, [data.email, user, isAdminMode]);

  // Create SetupIntent for PaymentElement when needed (new customers without saved cards)
  useEffect(() => {
    // Need valid email to create SetupIntent - validate first
    const emailResult = emailSchema.safeParse(data.email);
    if (!emailResult.success) {
      return;
    }
    
    // Also skip if still checking for guest customer
    if (checkingGuestCustomer) {
      return;
    }
    
    const createSetupIntent = async () => {
      // Only create SetupIntent for customer mode (not admin), when paying by card,
      // and when customer doesn't have saved payment methods
      // Also skip if guest has saved cards and wants to use them
      if (isAdminMode || paymentType !== 'card' || hasPaymentMethods || loadingSetupIntent) {
        return;
      }
      
      // Skip if guest has saved cards and wants to use them
      if (guestPaymentMethods.length > 0 && useGuestSavedCard) {
        return;
      }
      
      setLoadingSetupIntent(true);
      try {
        console.log('[PaymentStep] Creating SetupIntent for PaymentElement...');
        const { data: setupData, error } = await supabase.functions.invoke('stripe-create-setup-intent', {
          body: {
            email: data.email,
            name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email,
          }
        });
        
        if (error) {
          console.error('[PaymentStep] SetupIntent creation error:', error);
          setLoadingSetupIntent(false);
          return;
        }
        
        if (setupData?.clientSecret) {
          console.log('[PaymentStep] SetupIntent created successfully');
          setSetupIntentClientSecret(setupData.clientSecret);
        }
      } catch (err) {
        console.error('[PaymentStep] Error creating SetupIntent:', err);
      } finally {
        setLoadingSetupIntent(false);
      }
    };
    
    // Debounce the SetupIntent creation to avoid calling with partial email
    const timeoutId = setTimeout(createSetupIntent, 800);
    return () => clearTimeout(timeoutId);
  }, [isAdminMode, paymentType, hasPaymentMethods, data.email, data.firstName, data.lastName, guestPaymentMethods.length, useGuestSavedCard, checkingGuestCustomer]);

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePhone = (phone: string) => {
    if (!phone) {
      setPhoneError('Phone is required');
      return false;
    }
    const result = ukPhoneSchema.safeParse(phone);
    if (!result.success) {
      setPhoneError('Phone must be +44 followed by 10 digits');
      return false;
    }
    setPhoneError('');
    return true;
  };

  // Handle return from Stripe Checkout
  useEffect(() => {
    const paymentSetup = searchParams.get('payment_setup');
    const bookingId = searchParams.get('bookingId');
    const urgent = searchParams.get('urgent');

    if (paymentSetup === 'success' && bookingId) {
      const handlePaymentReturn = async () => {
        try {
          setProcessing(true);

          // If urgent booking, charge immediately
          if (urgent === '1') {
            const { data: chargeResult, error: chargeError } = await supabase.functions.invoke(
              'system-payment-action',
              {
                body: {
                  bookingId: parseInt(bookingId),
                  action: 'charge'
                }
              }
            );

            if (chargeError || !chargeResult?.success) {
              throw new Error(chargeResult?.error || 'Payment failed');
            }
          }

          // Call success callback for quote lead tracking
          onBookingSuccess?.(parseInt(bookingId));

          // Navigate to confirmation or upcoming bookings for admin
          if (isAdminMode) {
            navigate(`/upcoming-bookings`, { replace: true });
            toast({
              title: "Booking Created",
              description: "Booking created successfully. You can view it in upcoming bookings.",
            });
          } else {
            navigate(`/booking-confirmation?bookingId=${bookingId}`, { replace: true });
          }
        } catch (error: any) {
          console.error('Payment return error:', error);
          toast({
            title: "Payment Error",
            description: error.message || "Failed to process payment",
            variant: "destructive"
          });
          setProcessing(false);
        }
      };

      handlePaymentReturn();
    } else if (paymentSetup === 'cancelled') {
      toast({
        title: "Payment Cancelled",
        description: "You cancelled the payment setup. Please try again.",
        variant: "destructive"
      });
      // Clear the URL params
      navigate(window.location.pathname, { replace: true });
    }
  }, [searchParams]);

  const handleSubmit = async () => {
    // Track booking attempt BEFORE validation - this captures ALL click attempts
    // so we can see when users tried to complete but failed
    if (onBookingAttempt) {
      onBookingAttempt();
    }

    // Validate before submission
    const isEmailValid = validateEmail(data.email);
    const isPhoneValid = validatePhone(data.phone);

    if (!isEmailValid || !isPhoneValid) {
      toast({
        title: "Validation Error",
        description: "Please check your email and phone number",
        variant: "destructive"
      });
      return;
    }

    // Admin test mode - skip payment completely
    if (adminTestMode) {
      try {
        setProcessing(true);
        
        const result = await submitBooking({
          // Admin/Customer details
          customerId: data.customerId, // Pass admin-selected customer ID
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          
          // Property address
          addressId: data.addressId, // Pass admin-selected address ID
          houseNumber: data.houseNumber,
          street: data.street,
          postcode: data.postcode,
          city: data.city,
          
          // Property details
          propertyType: data.propertyType,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          toilets: data.toilets,
          numberOfFloors: data.numberOfFloors,
          additionalRooms: data.additionalRooms,
          propertyFeatures: data.propertyFeatures,
          
          // Service details
          subServiceType: subServiceType,
          serviceType: data.serviceType,
          serviceFrequency: data.serviceFrequency,
          alreadyCleaned: data.alreadyCleaned,
          ovenType: data.ovenType,
          cleaningProducts: data.cleaningProducts?.join(',') || '',
          equipmentArrangement: data.equipmentArrangement,
          equipmentStorageConfirmed: data.equipmentStorageConfirmed,
          
          // Linens
          linensHandling: data.linensHandling,
          needsIroning: data.needsIroning,
          ironingHours: data.ironingHours,
          linenPackages: data.linenPackages,
          extraHours: data.extraHours,
          
          // Schedule
          selectedDate: data.selectedDate,
          selectedTime: data.selectedTime,
          flexibility: data.flexibility,
          sameDayTurnaround: data.sameDayTurnaround,
          shortNoticeCharge: data.shortNoticeCharge,
          
          // Access
          propertyAccess: data.propertyAccess,
          accessNotes: data.accessNotes,
          
          // Costs
          totalCost: data.totalCost,
          estimatedHours: data.estimatedHours,
          totalHours: data.totalHours,
          hourlyRate: data.hourlyRate,
          weeklyCost: data.weeklyCost, // Recurring weekly cost (may include discounts)
          
          // Notes
          notes: data.notes,
          additionalDetails: data,
          cleanerId: data.cleanerId, // Include cleaner assignment
          agentUserId: data.agentUserId // Agent attribution from quote link
        }, true);

        if (!result.success || !result.bookingId) {
          throw new Error('Failed to create booking');
        }

        toast({
          title: "Test Booking Created",
          description: "Admin test mode - payment skipped"
        });

        // Call success callback for quote lead tracking
        onBookingSuccess?.(result.bookingId);

        if (isAdminMode) {
          navigate('/upcoming-bookings', { replace: true });
        } else {
          navigate('/booking-confirmation', { state: { bookingId: result.bookingId } });
        }
        return;
      } catch (error: any) {
        console.error('Booking error:', error);
        toast({
          title: "Booking Error",
          description: error.message || "Failed to create booking",
          variant: "destructive"
        });
        setProcessing(false);
        return;
      }
    }

    // Bank transfer mode - create booking via edge function (bypasses RLS) and send SMS with bank details
    if (paymentType === 'bank-transfer' && canUseBankTransfer) {
      try {
        setProcessing(true);
        
        // Apply first-time customer 10% discount if applicable
        // This ensures the discount is included even if the summary component hasn't synced yet
        let finalTotalCost = data.totalCost;
        if (data.isFirstTimeCustomer && finalTotalCost > 0) {
          // Check if discount is already applied (total should be less than hours * hourlyRate)
          const baseTotal = (data.totalHours || data.estimatedHours || 0) * (data.hourlyRate || 0);
          if (finalTotalCost >= baseTotal * 0.95) { // Allow 5% tolerance for other charges
            // Discount not yet applied, apply it now
            finalTotalCost = Math.round(finalTotalCost * 0.90 * 100) / 100;
            console.log('[PaymentStep] Applied first-time customer 10% discount for bank transfer:', { original: data.totalCost, discounted: finalTotalCost });
          }
        }
        
        // Use edge function to create booking (bypasses RLS for guest users)
        const { data: bookingResult, error: bookingError } = await supabase.functions.invoke('create-public-booking', {
          body: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            houseNumber: data.houseNumber,
            street: data.street,
            postcode: data.postcode,
            city: data.city,
            addressId: data.addressId,
            propertyType: data.propertyType,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            toilets: data.toilets,
            numberOfFloors: data.numberOfFloors,
            additionalRooms: data.additionalRooms,
            propertyFeatures: data.propertyFeatures,
            serviceType: subServiceType === 'domestic' ? 'Domestic' : (subServiceType === 'airbnb' ? 'Air BnB' : 'Commercial'),
            cleaningType: data.wantsFirstDeepClean ? 'Deep Cleaning' : 'Standard Cleaning',
            serviceFrequency: data.serviceFrequency,
            ovenType: data.ovenType,
            selectedDate: data.selectedDate?.toISOString(),
            selectedTime: data.selectedTime,
            flexibility: data.flexibility,
            shortNoticeCharge: data.shortNoticeCharge,
            propertyAccess: data.propertyAccess,
            accessNotes: data.accessNotes,
            totalCost: finalTotalCost,
            estimatedHours: data.estimatedHours,
            totalHours: data.totalHours,
            hourlyRate: data.hourlyRate,
            weeklyCost: data.weeklyCost,
            notes: data.notes,
            paymentMethod: 'Bank Transfer',
            agentUserId: data.agentUserId,
            wantsFirstDeepClean: data.wantsFirstDeepClean,
            firstDeepCleanExtraHours: data.firstDeepCleanExtraHours
          }
        });

        if (bookingError || !bookingResult?.success) {
          console.error('Booking creation error:', bookingError || bookingResult);
          throw new Error(bookingResult?.error || bookingError?.message || 'Failed to create booking');
        }

        const bookingId = bookingResult.bookingId;
        console.log('[PaymentStep] Bank transfer booking created:', bookingId);

        // Send SMS with bank transfer details
        try {
          const bookingDate = data.selectedDate 
            ? new Date(data.selectedDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            : 'your scheduled date';
          
          await supabase.functions.invoke('send-bank-transfer-sms', {
            body: {
              bookingId: bookingId,
              phoneNumber: data.phone,
              customerName: data.firstName,
              amount: finalTotalCost, // Use discounted amount
              bookingDate: bookingDate
            }
          });
          
          console.log('Bank transfer SMS sent successfully');
        } catch (smsError) {
          console.error('Failed to send bank transfer SMS:', smsError);
          // Don't fail the booking if SMS fails
        }

        // Call success callback for quote lead tracking
        onBookingSuccess?.(bookingId);

        // Navigate to confirmation page (no toast needed as confirmation page shows the details)
        window.scrollTo({ top: 0, behavior: 'smooth' });
        navigate('/booking-confirmation', { state: { bookingId: bookingId, paymentMethod: 'bank-transfer' } });
        return;
      } catch (error: any) {
        console.error('Booking error:', error);
        toast({
          title: "Booking Error",
          description: error.message || "Failed to create booking",
          variant: "destructive"
        });
        setProcessing(false);
        return;
      }
    }

    // Admin mode - No payment selected (customer will add card later via notification)
    if (isAdminMode && selectedAdminPaymentMethod === 'no-payment') {
      try {
        setProcessing(true);
        
        const result = await submitBooking({
          customerId: data.customerId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          addressId: data.addressId,
          houseNumber: data.houseNumber,
          street: data.street,
          postcode: data.postcode,
          city: data.city,
          propertyType: data.propertyType,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          toilets: data.toilets,
          numberOfFloors: data.numberOfFloors,
          additionalRooms: data.additionalRooms,
          propertyFeatures: data.propertyFeatures,
          subServiceType: subServiceType,
          serviceType: data.serviceType,
          serviceFrequency: data.serviceFrequency,
          alreadyCleaned: data.alreadyCleaned,
          ovenType: data.ovenType,
          cleaningProducts: data.cleaningProducts?.join(',') || '',
          equipmentArrangement: data.equipmentArrangement,
          equipmentStorageConfirmed: data.equipmentStorageConfirmed,
          linensHandling: data.linensHandling,
          needsIroning: data.needsIroning,
          ironingHours: data.ironingHours,
          linenPackages: data.linenPackages,
          extraHours: data.extraHours,
          selectedDate: data.selectedDate,
          selectedTime: data.selectedTime,
          flexibility: data.flexibility,
          sameDayTurnaround: data.sameDayTurnaround,
          shortNoticeCharge: data.shortNoticeCharge,
          propertyAccess: data.propertyAccess,
          accessNotes: data.accessNotes,
          totalCost: data.totalCost,
          estimatedHours: data.estimatedHours,
          totalHours: data.totalHours,
          hourlyRate: data.hourlyRate,
          weeklyCost: data.weeklyCost,
          notes: data.notes,
          additionalDetails: data,
          cleanerId: data.cleanerId,
          paymentMethod: 'card', // Save as 'card' to trigger payment collection notification
          agentUserId: data.agentUserId // Agent attribution from quote link
        }, true);

        if (!result.success || !result.bookingId) {
          throw new Error('Failed to create booking');
        }

        toast({
          title: "Booking Created",
          description: "Customer will receive notification to add payment method.",
        });

        // Call success callback for quote lead tracking
        onBookingSuccess?.(result.bookingId);

        navigate('/upcoming-bookings', { replace: true });
        return;
      } catch (error: any) {
        console.error('Booking error:', error);
        toast({
          title: "Booking Error",
          description: error.message || "Failed to create booking",
          variant: "destructive"
        });
        setProcessing(false);
        return;
      }
    }

    // Admin mode - Bank transfer selected
    if (isAdminMode && selectedAdminPaymentMethod === 'bank-transfer') {
      try {
        setProcessing(true);
        
        const result = await submitBooking({
          customerId: data.customerId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          addressId: data.addressId,
          houseNumber: data.houseNumber,
          street: data.street,
          postcode: data.postcode,
          city: data.city,
          propertyType: data.propertyType,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          toilets: data.toilets,
          numberOfFloors: data.numberOfFloors,
          additionalRooms: data.additionalRooms,
          propertyFeatures: data.propertyFeatures,
          subServiceType: subServiceType,
          serviceType: data.serviceType,
          serviceFrequency: data.serviceFrequency,
          alreadyCleaned: data.alreadyCleaned,
          ovenType: data.ovenType,
          cleaningProducts: data.cleaningProducts?.join(',') || '',
          equipmentArrangement: data.equipmentArrangement,
          equipmentStorageConfirmed: data.equipmentStorageConfirmed,
          linensHandling: data.linensHandling,
          needsIroning: data.needsIroning,
          ironingHours: data.ironingHours,
          linenPackages: data.linenPackages,
          extraHours: data.extraHours,
          selectedDate: data.selectedDate,
          selectedTime: data.selectedTime,
          flexibility: data.flexibility,
          sameDayTurnaround: data.sameDayTurnaround,
          shortNoticeCharge: data.shortNoticeCharge,
          propertyAccess: data.propertyAccess,
          accessNotes: data.accessNotes,
          totalCost: data.totalCost,
          estimatedHours: data.estimatedHours,
          totalHours: data.totalHours,
          hourlyRate: data.hourlyRate,
          weeklyCost: data.weeklyCost,
          notes: data.notes,
          additionalDetails: data,
          cleanerId: data.cleanerId,
          paymentMethod: 'bank-transfer',
          agentUserId: data.agentUserId // Agent attribution from quote link
        }, true);

        if (!result.success || !result.bookingId) {
          throw new Error('Failed to create booking');
        }

        toast({
          title: "Booking Created",
          description: "Bank transfer details will be sent to customer.",
        });

        // Call success callback for quote lead tracking
        onBookingSuccess?.(result.bookingId);

        navigate('/upcoming-bookings', { replace: true });
        return;
      } catch (error: any) {
        console.error('Booking error:', error);
        toast({
          title: "Booking Error",
          description: error.message || "Failed to create booking",
          variant: "destructive"
        });
        setProcessing(false);
        return;
      }
    }

    // Admin mode without specific payment selection - default to no-payment
    if (isAdminMode && (!selectedAdminPaymentMethod || selectedAdminPaymentMethod === '')) {
      try {
        setProcessing(true);
        
        const result = await submitBooking({
          customerId: data.customerId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          addressId: data.addressId,
          houseNumber: data.houseNumber,
          street: data.street,
          postcode: data.postcode,
          city: data.city,
          propertyType: data.propertyType,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          toilets: data.toilets,
          numberOfFloors: data.numberOfFloors,
          additionalRooms: data.additionalRooms,
          propertyFeatures: data.propertyFeatures,
          subServiceType: subServiceType,
          serviceType: data.serviceType,
          serviceFrequency: data.serviceFrequency,
          alreadyCleaned: data.alreadyCleaned,
          ovenType: data.ovenType,
          cleaningProducts: data.cleaningProducts?.join(',') || '',
          equipmentArrangement: data.equipmentArrangement,
          equipmentStorageConfirmed: data.equipmentStorageConfirmed,
          linensHandling: data.linensHandling,
          needsIroning: data.needsIroning,
          ironingHours: data.ironingHours,
          linenPackages: data.linenPackages,
          extraHours: data.extraHours,
          selectedDate: data.selectedDate,
          selectedTime: data.selectedTime,
          flexibility: data.flexibility,
          sameDayTurnaround: data.sameDayTurnaround,
          shortNoticeCharge: data.shortNoticeCharge,
          propertyAccess: data.propertyAccess,
          accessNotes: data.accessNotes,
          totalCost: data.totalCost,
          estimatedHours: data.estimatedHours,
          totalHours: data.totalHours,
          hourlyRate: data.hourlyRate,
          weeklyCost: data.weeklyCost,
          notes: data.notes,
          additionalDetails: data,
          cleanerId: data.cleanerId,
          paymentMethod: null,
          agentUserId: data.agentUserId // Agent attribution from quote link
        }, true);

        if (!result.success || !result.bookingId) {
          throw new Error('Failed to create booking');
        }

        toast({
          title: "Booking Created",
          description: "Booking created successfully.",
        });

        // Call success callback for quote lead tracking
        onBookingSuccess?.(result.bookingId);

        navigate('/upcoming-bookings', { replace: true });
        return;
      } catch (error: any) {
        console.error('Booking error:', error);
        toast({
          title: "Booking Error",
          description: error.message || "Failed to create booking",
          variant: "destructive"
        });
        setProcessing(false);
        return;
      }
    }

    // Normal payment flow - use existing payment system
    try {
      setProcessing(true);

      console.log('[PaymentStep] Submitting booking payload');

      // Prepare booking data
      const bookingPayload = {
        // Admin/Customer details
        customerId: data.customerId, // Pass admin-selected customer ID
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        // Property address
        addressId: data.addressId, // Pass admin-selected address ID
        houseNumber: data.houseNumber,
        street: data.street,
        postcode: data.postcode,
        city: data.city,
        propertyType: data.propertyType,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        toilets: data.toilets,
        numberOfFloors: data.numberOfFloors,
        additionalRooms: data.additionalRooms,
        propertyFeatures: data.propertyFeatures,
        subServiceType: subServiceType,
        serviceType: data.serviceType,
        serviceFrequency: data.serviceFrequency,
        alreadyCleaned: data.alreadyCleaned,
        ovenType: data.ovenType,
        cleaningProducts: data.cleaningProducts?.join(',') || '',
        equipmentArrangement: data.equipmentArrangement,
        equipmentStorageConfirmed: data.equipmentStorageConfirmed,
        linensHandling: data.linensHandling,
        needsIroning: data.needsIroning,
        ironingHours: data.ironingHours,
        linenPackages: data.linenPackages,
        extraHours: data.extraHours,
        selectedDate: data.selectedDate,
        selectedTime: data.selectedTime,
        flexibility: data.flexibility,
        sameDayTurnaround: data.sameDayTurnaround,
        shortNoticeCharge: data.shortNoticeCharge,
        propertyAccess: data.propertyAccess,
        accessNotes: data.accessNotes,
        totalCost: data.totalCost,
        estimatedHours: data.estimatedHours,
        totalHours: data.totalHours,
        hourlyRate: data.hourlyRate,
        weeklyCost: data.weeklyCost,
        notes: data.notes,
        additionalDetails: data,
        cleanerId: data.cleanerId, // Include cleaner assignment
        paymentMethod: selectedAdminPaymentMethod || (defaultPaymentMethod ? 'Stripe' : (guestPaymentMethods.length > 0 && useGuestSavedCard ? 'Stripe' : null)), // Include payment method
        agentUserId: data.agentUserId, // Agent attribution from quote link
        guestCustomerId: guestCustomerId // Pass guest customer ID for saved card lookup
      };

      // Check if using a saved payment method (customer's, admin-selected, or guest with saved card)
      const usingSavedPaymentMethod = (customerId && defaultPaymentMethod) || 
                                      (isAdminMode && selectedAdminPaymentMethod) ||
                                      (guestPaymentMethods.length > 0 && useGuestSavedCard && paymentType === 'card');

      if (usingSavedPaymentMethod) {
        // Submit booking first
        const result = await submitBooking(bookingPayload, true);

        console.log('[PaymentStep] submitBooking result (using saved PM):', result);

        if (!result.success || !result.bookingId) {
          const errorDetail = result.error || 'Unknown error occurred while creating booking';
          throw new Error(`Booking creation failed: ${errorDetail}`);
        }

        // Handle Stripe charge timing based on admin selection
        const chargeTiming = data.stripeChargeTiming || 'authorize';
        
        if (chargeTiming === 'immediate' || (isUrgentBooking && chargeTiming !== 'none')) {
          // Charge immediately
          const { data: chargeResult, error: chargeError } = await supabase.functions.invoke(
            'system-payment-action',
            {
              body: {
                bookingId: result.bookingId,
                action: 'charge'
              }
            }
          );

          if (chargeError || !chargeResult?.success) {
            const errorDetail = chargeResult?.error || chargeResult?.message || chargeError?.message || 'Card was declined or payment could not be processed';
            throw new Error(`Payment failed: ${errorDetail}`);
          }
        } else if (chargeTiming === 'authorize') {
          // Authorize payment for later capture
          console.log('[PaymentStep] Authorizing payment...');
          const { data: authResult, error: authError } = await supabase.functions.invoke(
            'system-payment-action',
            {
              body: {
                bookingId: result.bookingId,
                action: 'authorize'
              }
            }
          );

          if (authError || !authResult?.success) {
            const errorDetail = authResult?.error || authResult?.message || authError?.message || 'Card authorization was declined. Please check your card details or try a different payment method.';
            throw new Error(`Authorization failed: ${errorDetail}`);
          }
          console.log('[PaymentStep] Payment authorized successfully');
        }
        // If 'none', skip payment processing

        // Call success callback for quote lead tracking
        onBookingSuccess?.(result.bookingId);

        if (isAdminMode) {
          navigate('/upcoming-bookings', { replace: true });
          toast({
            title: "Booking Created",
            description: "Booking created successfully. You can view it in upcoming bookings.",
          });
        } else {
          navigate('/booking-confirmation', { state: { bookingId: result.bookingId } });
        }
      } else {
        // No saved payment method - use edge function to create booking and redirect to Stripe Checkout
        // This approach handles 3D Secure properly on mobile and avoids RLS issues
        console.log('[PaymentStep] No saved payment method - using Stripe Checkout flow');
        
        // Step 1: Create booking via edge function (bypasses RLS for guest users)
        const { data: bookingResult, error: bookingError } = await supabase.functions.invoke('create-public-booking', {
          body: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            houseNumber: data.houseNumber,
            street: data.street,
            postcode: data.postcode,
            city: data.city,
            addressId: data.addressId,
            propertyType: data.propertyType,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            toilets: data.toilets,
            numberOfFloors: data.numberOfFloors,
            additionalRooms: data.additionalRooms,
            propertyFeatures: data.propertyFeatures,
            serviceType: subServiceType === 'domestic' ? 'Domestic' : (subServiceType === 'airbnb' ? 'Air BnB' : 'Commercial'),
            cleaningType: data.wantsFirstDeepClean ? 'Deep Cleaning' : 'Standard Cleaning',
            serviceFrequency: data.serviceFrequency,
            ovenType: data.ovenType,
            selectedDate: data.selectedDate?.toISOString(),
            selectedTime: data.selectedTime,
            flexibility: data.flexibility,
            shortNoticeCharge: data.shortNoticeCharge,
            propertyAccess: data.propertyAccess,
            accessNotes: data.accessNotes,
            totalCost: data.totalCost,
            estimatedHours: data.estimatedHours,
            totalHours: data.totalHours,
            hourlyRate: data.hourlyRate,
            weeklyCost: data.weeklyCost,
            notes: data.notes,
            paymentMethod: 'Stripe',
            agentUserId: data.agentUserId,
            wantsFirstDeepClean: data.wantsFirstDeepClean,
            firstDeepCleanExtraHours: data.firstDeepCleanExtraHours
          }
        });

        if (bookingError || !bookingResult?.success) {
          console.error('[PaymentStep] Booking creation via edge function failed:', bookingError || bookingResult);
          throw new Error(bookingResult?.error || bookingError?.message || 'Failed to create booking');
        }

        const bookingId = bookingResult.bookingId;
        const customerId = bookingResult.customerId;
        console.log('[PaymentStep] Booking created via edge function:', { bookingId, customerId });

        // Step 2: Redirect to Stripe Checkout
        // For urgent bookings (< 48 hours): Use stripe-send-payment-link (pay now + save card)
        // For non-urgent bookings: Use stripe-collect-payment-method (save card for later authorization)
        
        const returnUrl = `${window.location.origin}/booking-confirmation?bookingId=${bookingId}&payment_setup=success${isUrgentBooking ? '&urgent=1' : ''}`;
        
        if (isUrgentBooking) {
          // Urgent booking: Create payment checkout to pay now and save card
          console.log('[PaymentStep] Urgent booking - redirecting to payment checkout...');
          
          const { data: paymentResult, error: paymentError } = await supabase.functions.invoke('stripe-send-payment-link', {
            body: {
              customer_id: customerId,
              email: data.email,
              name: `${data.firstName} ${data.lastName}`,
              amount: data.totalCost,
              description: `Cleaning Service - ${data.selectedDate ? new Date(data.selectedDate).toLocaleDateString('en-GB') : 'Booking'} - #${bookingId}`,
              booking_id: bookingId,
              collect_payment_method: true, // Save card for future use
              payment_method_type: 'card' // Explicitly use card to avoid automatic_payment_methods error
            }
          });

          if (paymentError || !paymentResult?.success) {
            console.error('[PaymentStep] Payment link creation failed:', paymentError || paymentResult);
            throw new Error(paymentResult?.error || paymentError?.message || 'Failed to create payment link');
          }

          console.log('[PaymentStep] Redirecting to Stripe Checkout for payment...');
          
          // Store booking ID and quote tracking data for return from Stripe
          sessionStorage.setItem('pending_booking_id', bookingId.toString());
          sessionStorage.setItem('pending_quote_session_id', localStorage.getItem('quote_session_id') || '');
          sessionStorage.setItem('pending_quote_cost', data.totalCost?.toString() || '');
          
          // Set flag to prevent beforeunload from marking as 'left'
          localStorage.setItem('payment_redirect_in_progress', 'true');
          
          // Redirect to Stripe Checkout
          window.location.href = paymentResult.payment_link_url;
        } else {
          // Non-urgent booking: Create setup session to collect card for later authorization
          console.log('[PaymentStep] Non-urgent booking - redirecting to card collection...');
          
          const { data: setupResult, error: setupError } = await supabase.functions.invoke('stripe-collect-payment-method', {
            body: {
              customer_id: customerId,
              email: data.email,
              name: `${data.firstName} ${data.lastName}`,
              return_url: returnUrl,
              booking_details: {
                address: `${data.houseNumber || ''} ${data.street || ''}, ${data.postcode || ''}`.trim(),
                total_cost: data.totalCost,
                cleaning_type: data.wantsFirstDeepClean ? 'Deep Cleaning' : 'Standard Cleaning',
                date_time: data.selectedDate?.toISOString()
              },
              collect_only: false,
              send_email: false, // Don't send email, customer is being redirected
              payment_method_type: 'card' // Explicitly use card to avoid automatic_payment_methods error
            }
          });

          if (setupError || !setupResult?.success) {
            console.error('[PaymentStep] Card collection setup failed:', setupError || setupResult);
            throw new Error(setupResult?.error || setupError?.message || 'Failed to setup card collection');
          }

          console.log('[PaymentStep] Redirecting to Stripe Checkout for card collection...');
          
          // Store booking ID and quote tracking data for return from Stripe
          sessionStorage.setItem('pending_booking_id', bookingId.toString());
          sessionStorage.setItem('pending_quote_session_id', localStorage.getItem('quote_session_id') || '');
          sessionStorage.setItem('pending_quote_cost', data.totalCost?.toString() || '');
          
          // Set flag to prevent beforeunload from marking as 'left'
          localStorage.setItem('payment_redirect_in_progress', 'true');
          
          // Redirect to Stripe Checkout
          window.location.href = setupResult.checkout_url;
        }
        
        // Note: User will be redirected, so we don't navigate here
        // The return URL will handle navigation to confirmation page
        return;
      }
      
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const canContinue = data.firstName && data.lastName && data.email && data.phone && data.street && data.postcode;
  
  // Check if payment requirements are met
  // For admin mode: always allow (customer will receive notification to add payment method)
  // For guests with card: always allow - they will be redirected to Stripe Checkout
  // For guests with bank transfer: always allow
  // For guests with saved card: allow if they're using their saved card
  const paymentRequirementsMet = isAdminMode || paymentType === 'bank-transfer' || hasPaymentMethods || adminTestMode || paymentType === 'card' || (guestPaymentMethods.length > 0 && useGuestSavedCard);

  return (
    <div className="space-y-8">
      {/* Quote Link Mode: Booking Summary at Top */}
      {isQuoteLinkMode && !isAdminMode && (
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6 border-2 border-primary/20">
          <h3 className="text-xl font-bold text-[#185166] mb-4 flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Your Booking Summary
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Home className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Property:</span>{' '}
                {data.bedrooms} Bed {data.propertyType === 'flat' ? 'Flat' : 'House'}{' '}
                • {data.serviceFrequency === 'weekly' ? 'Weekly' : data.serviceFrequency === 'biweekly' ? 'Bi-weekly' : data.serviceFrequency === 'monthly' ? 'Monthly' : 'One-time'} cleaning
              </div>
            </div>
            {data.selectedDate && (
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Date & Time:</span>{' '}
                  {data.selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}{' '}
                  at {data.selectedTime}
                </div>
              </div>
            )}
            {(data.street || data.houseNumber || data.postcode) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Address:</span>{' '}
                  {[data.houseNumber, data.street, data.city, data.postcode].filter(Boolean).join(', ') || data.postcode}
                </div>
              </div>
            )}
            <div className="pt-3 mt-3 border-t border-primary/20 space-y-2">
              {/* Show first clean cost + weekly cost when weeklyCost is present (indicates first deep clean or recurring) */}
              {data.weeklyCost && data.weeklyCost !== data.totalCost && data.serviceFrequency !== 'one-time' && (
                <>
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-bold">First Clean ({data.estimatedHours || data.firstDeepCleanExtraHours ? `${((data.estimatedHours || 0) + (data.firstDeepCleanExtraHours || 0)).toFixed(1)} hrs` : ''}):</span>
                    <span className="font-bold text-primary">£{data.totalCost?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center text-base text-muted-foreground">
                    <span>Then {data.serviceFrequency === 'weekly' ? 'weekly' : data.serviceFrequency === 'biweekly' ? 'bi-weekly' : 'monthly'} ({data.estimatedHours?.toFixed(1) || '0'} hrs):</span>
                    <span>£{data.weeklyCost?.toFixed(2)}/visit</span>
                  </div>
                </>
              )}
              {/* Standard display for one-time or when no weekly cost difference */}
              {(!data.weeklyCost || data.weeklyCost === data.totalCost || data.serviceFrequency === 'one-time') && (
                <div className="flex justify-between items-center text-lg">
                  <span className="font-bold">Total{data.serviceFrequency !== 'one-time' ? '/visit' : ''} ({data.estimatedHours?.toFixed(1) || '0'} hrs):</span>
                  <span className="font-bold text-primary">£{data.totalCost?.toFixed(2) || '0.00'}</span>
                </div>
              )}
            </div>
          </div>
          
        </div>
      )}

      {/* Admin Test Mode Warning */}
      {adminTestMode && (
        <div className="bg-orange-50 border-2 border-orange-500 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-orange-500 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-orange-900">Admin Test Mode Active</h3>
              <p className="text-sm text-orange-700">
                Payment will be skipped. This booking will be created without payment verification.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN MODE: Customer Selection */}
      {isAdminMode && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-[#185166] mb-4">
            Select Customer
          </h3>
          
          <CustomerSelector 
            selectedCustomer={data.selectedCustomer}
            onCustomerSelect={(customer) => {
              if (customer) {
                onUpdate({ 
                  customerId: customer.id,
                  selectedCustomer: customer,
                  firstName: customer.first_name,
                  lastName: customer.last_name,
                  email: customer.email,
                  phone: customer.phone,
                  // Clear address when customer changes
                  addressId: undefined,
                  selectedAddress: undefined,
                  street: '',
                  postcode: '',
                  city: ''
                });
              } else {
                onUpdate({ 
                  customerId: undefined,
                  selectedCustomer: undefined,
                  firstName: '',
                  lastName: '',
                  email: '',
                  phone: '',
                  addressId: undefined,
                  selectedAddress: undefined,
                  street: '',
                  postcode: '',
                  city: ''
                });
              }
            }}
          />
        </div>
      )}

      {/* Customer Details - Admin (editable - shown for existing or new customer) */}
      {isAdminMode && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-[#185166] mb-4">
            Customer Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="First Name"
              value={data.firstName || ''}
              onChange={(e) => onUpdate({ firstName: e.target.value })}
              className="h-16 text-lg rounded-2xl border-2 border-gray-200 bg-white focus:border-[#185166] focus:ring-0 px-6 font-medium transition-all duration-200 placeholder:text-gray-400"
            />
            <Input
              placeholder="Last Name"
              value={data.lastName || ''}
              onChange={(e) => onUpdate({ lastName: e.target.value })}
              className="h-16 text-lg rounded-2xl border-2 border-gray-200 bg-white focus:border-[#185166] focus:ring-0 px-6 font-medium transition-all duration-200 placeholder:text-gray-400"
            />
          </div>
          <div>
            <Input
              type="email"
              placeholder="Email Address"
              value={data.email || ''}
              onChange={(e) => {
                onUpdate({ email: e.target.value });
                setEmailError('');
              }}
              onBlur={(e) => validateEmail(e.target.value)}
              className={`h-16 text-lg rounded-2xl border-2 bg-white focus:border-[#185166] focus:ring-0 px-6 font-medium transition-all duration-200 placeholder:text-gray-400 ${emailError ? 'border-red-500' : 'border-gray-200'}`}
            />
            {emailError && (
              <p className="text-xs text-red-600 font-medium mt-1">{emailError}</p>
            )}
          </div>
          <div>
            <PhoneInput
              value={data.phone || ''}
              onChange={(value) => {
                onUpdate({ phone: value });
                setPhoneError('');
              }}
              placeholder="7123 456 789"
            />
            {phoneError && (
              <p className="text-xs text-red-600 font-medium mt-1">{phoneError}</p>
            )}
          </div>
        </div>
      )}

      {/* Customer/Guest Mode - show customer details */}
      {!isAdminMode && (
        <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
          <div className="rounded-2xl border-2 border-gray-200 bg-white transition-all">
            <CollapsibleTrigger className="w-full p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                {isQuoteLinkMode && data.firstName && !detailsOpen && (
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                )}
                <div>
                  <h3 className="text-xl font-bold text-[#185166]">
                    Your Details
                  </h3>
                  {isQuoteLinkMode && !detailsOpen && data.firstName && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {data.firstName} {data.lastName} • {data.email} • {data.phone}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isQuoteLinkMode && !detailsOpen && (
                  <span className="text-sm text-primary font-medium flex items-center gap-1">
                    <Pencil className="h-3 w-3" /> Edit
                  </span>
                )}
                {detailsOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="First Name"
                    value={data.firstName || ''}
                    onChange={(e) => onUpdate({ firstName: e.target.value })}
                    className="h-16 text-lg rounded-2xl border-2 border-gray-200 bg-white focus:border-[#185166] focus:ring-0 px-6 font-medium transition-all duration-200 placeholder:text-gray-400"
                  />
                  <Input
                    placeholder="Last Name"
                    value={data.lastName || ''}
                    onChange={(e) => onUpdate({ lastName: e.target.value })}
                    className="h-16 text-lg rounded-2xl border-2 border-gray-200 bg-white focus:border-[#185166] focus:ring-0 px-6 font-medium transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>
                
                <div>
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={data.email || ''}
                    onChange={(e) => {
                      onUpdate({ email: e.target.value });
                      setEmailError('');
                    }}
                    onBlur={(e) => validateEmail(e.target.value)}
                    className={`h-16 text-lg rounded-2xl border-2 bg-white focus:border-[#185166] focus:ring-0 px-6 font-medium transition-all duration-200 placeholder:text-gray-400 ${emailError ? 'border-red-500' : 'border-gray-200'}`}
                  />
                  {emailError && (
                    <p className="text-xs text-red-600 font-medium mt-1">{emailError}</p>
                  )}
                </div>
                
                <div>
                  <PhoneInput
                    value={data.phone || ''}
                    onChange={(value) => {
                      onUpdate({ phone: value });
                      setPhoneError('');
                    }}
                    placeholder="7123 456 789"
                  />
                  {phoneError && (
                    <p className="text-xs text-red-600 font-medium mt-1">{phoneError}</p>
                  )}
                </div>

                {/* Welcome back banner for returning guests with saved cards */}
                {!user && guestCustomerId && guestPaymentMethods.length > 0 && !checkingGuestCustomer && (
                  <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Check className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-green-800">
                          Welcome back{guestCustomerName ? `, ${guestCustomerName.split(' ')[0]}` : ''}! 👋
                        </p>
                        <p className="text-sm text-green-700 mt-0.5">
                          We found your account with a saved card on file ({guestPaymentMethods[0]?.card_brand?.toUpperCase?.()} •••• {guestPaymentMethods[0]?.card_last4}).
                        </p>
                        <p className="text-xs text-green-600 mt-2">
                          You can use your saved card or add a new payment method in the payment section below.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading indicator while checking for existing customer */}
                {checkingGuestCustomer && (
                  <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Checking for existing account...</span>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      {/* ADMIN MODE: Address Selection */}
      {isAdminMode && data.customerId && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-[#185166] mb-4">
            Select Address
          </h3>
          
          <AddressSelector 
            customerId={data.customerId}
            onAddressSelect={(address) => {
              if (address) {
                onUpdate({ 
                  addressId: address.id,
                  selectedAddress: address,
                  street: address.address,
                  postcode: address.postcode,
                  houseNumber: '',
                  city: ''
                });
              } else {
                onUpdate({ 
                  addressId: undefined,
                  selectedAddress: undefined,
                  street: '',
                  postcode: '',
                  city: ''
                });
              }
            }}
          />
        </div>
      )}

      {/* CUSTOMER MODE: Address Selection */}
      {!isAdminMode && effectiveCustomerId && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-[#185166] mb-4">
            Select Address
          </h3>
          <AddressSelector
            customerId={effectiveCustomerId}
            onAddressSelect={(address) => {
              if (address) {
                onUpdate({
                  addressId: address.id,
                  selectedAddress: address,
                  street: address.address,
                  postcode: address.postcode,
                  houseNumber: '',
                  city: ''
                });
              } else {
                onUpdate({
                  addressId: undefined,
                  selectedAddress: undefined,
                  street: '',
                  postcode: '',
                  city: ''
                });
              }
            }}
          />
        </div>
      )}

      {/* Booking Address - Only show if no address is selected or in admin mode */}
      {(isAdminMode || !data.addressId) && (
        <Collapsible open={addressOpen} onOpenChange={setAddressOpen}>
          <div className="rounded-2xl border-2 border-gray-200 bg-white transition-all">
            <CollapsibleTrigger className="w-full p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                {isQuoteLinkMode && data.street && !addressOpen && (
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                )}
                <div>
                  <h3 className="text-xl font-bold text-[#185166]">
                    Booking Address
                  </h3>
                  {isQuoteLinkMode && !addressOpen && data.street && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {[data.houseNumber, data.street, data.city, data.postcode].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isQuoteLinkMode && !addressOpen && (
                  <span className="text-sm text-primary font-medium flex items-center gap-1">
                    <Pencil className="h-3 w-3" /> Edit
                  </span>
                )}
                {addressOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    placeholder="House No."
                    value={data.houseNumber || ''}
                    onChange={(e) => onUpdate({ houseNumber: e.target.value })}
                    className="h-16 text-lg rounded-2xl border-2 border-gray-200 bg-white focus:border-[#185166] focus:ring-0 px-6 font-medium transition-all duration-200 placeholder:text-gray-400"
                  />
                  <Input
                    placeholder="Street Address"
                    value={data.street || ''}
                    onChange={(e) => onUpdate({ street: e.target.value })}
                    className="h-16 text-lg rounded-2xl border-2 border-gray-200 bg-white focus:border-[#185166] focus:ring-0 px-6 font-medium transition-all duration-200 placeholder:text-gray-400 col-span-2"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="City"
                    value={data.city || ''}
                    onChange={(e) => onUpdate({ city: e.target.value })}
                    className="h-16 text-lg rounded-2xl border-2 border-gray-200 bg-white focus:border-[#185166] focus:ring-0 px-6 font-medium transition-all duration-200 placeholder:text-gray-400"
                  />
                  <Input
                    placeholder="Postcode"
                    value={data.postcode || ''}
                    onChange={(e) => onUpdate({ postcode: e.target.value })}
                    className="h-16 text-lg rounded-2xl border-2 border-gray-200 bg-white focus:border-[#185166] focus:ring-0 px-6 font-medium transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      {/* Additional Notes - for quote link customers, after address section */}
      {isQuoteLinkMode && !isAdminMode && (
        <div className="space-y-3">
          <Label htmlFor="quote-notes" className="text-lg font-semibold text-[#185166]">
            Additional Notes (optional)
          </Label>
          <textarea
            id="quote-notes"
            value={data.notes || ''}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            placeholder="Any special instructions or notes for your cleaning..."
            className="w-full p-4 border-2 border-gray-200 rounded-2xl bg-white focus:border-primary focus:ring-0 text-base resize-none"
            rows={3}
          />
        </div>
      )}

      {isAdminMode && formType !== 'linen' && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-[#185166] mb-4 flex items-center gap-2">
            <User className="h-6 w-6" />
            Assign Cleaner (Optional)
          </h3>
          
          <Select
            value={data.cleanerId?.toString() || 'none'}
            onValueChange={(value) => onUpdate({ cleanerId: value && value !== 'none' ? parseInt(value) : undefined })}
          >
            <SelectTrigger className="h-16 text-lg rounded-2xl border-2 border-gray-200 bg-white">
              <SelectValue placeholder="Select a cleaner (optional)..." />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              <SelectItem value="none">No cleaner assigned</SelectItem>
              {cleaners.map((cleaner) => (
                <SelectItem key={cleaner.id} value={cleaner.id.toString()}>
                  {cleaner.full_name || `${cleaner.first_name || ''} ${cleaner.last_name || ''}`.trim()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
        </div>
      )}

      {/* ADMIN MODE: Payment Method Selection - show for existing or new customers */}
      {isAdminMode && !checkingPaymentMethods && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-[#185166] mb-4">
            Payment Method
          </h3>
          
          {/* Payment Type Selection for Admin */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <button
              type="button"
              onClick={() => {
                setSelectedAdminPaymentMethod('no-payment');
                onUpdate({ paymentMethod: 'no-payment' });
              }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                selectedAdminPaymentMethod === 'no-payment'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Clock className="h-6 w-6" />
              <span className="text-sm font-medium">No Payment</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedAdminPaymentMethod('bank-transfer');
                onUpdate({ paymentMethod: 'bank-transfer' });
              }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                selectedAdminPaymentMethod === 'bank-transfer'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Building2 className="h-6 w-6" />
              <span className="text-sm font-medium">Bank Transfer</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedAdminPaymentMethod('add-card');
                onUpdate({ paymentMethod: 'add-card' });
              }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                selectedAdminPaymentMethod === 'add-card'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <CreditCard className="h-6 w-6" />
              <span className="text-sm font-medium">Add Card</span>
            </button>
          </div>

          {/* Show saved cards if customer has them */}
          {hasPaymentMethods && paymentMethods.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Or use saved card:</p>
              {paymentMethods.map((pm: any) => (
                <button
                  key={pm.stripe_payment_method_id}
                  type="button"
                  onClick={() => {
                    setSelectedAdminPaymentMethod(`stripe:${pm.stripe_payment_method_id}`);
                    onUpdate({ paymentMethod: `stripe:${pm.stripe_payment_method_id}` });
                  }}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    selectedAdminPaymentMethod === `stripe:${pm.stripe_payment_method_id}`
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="font-medium">
                    {pm.card_brand?.toUpperCase?.()} •••• {pm.card_last4}
                  </span>
                  <span className="text-sm text-gray-500">
                    Exp: {pm.card_exp_month}/{pm.card_exp_year}
                  </span>
                  {pm.is_default && <span className="ml-auto text-yellow-500">⭐</span>}
                </button>
              ))}
            </div>
          )}

          {/* Card Element for adding new card */}
          {selectedAdminPaymentMethod === 'add-card' && (
            <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 mt-4 space-y-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Enter card details:</p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Card Number</label>
                <div className="p-3 border border-gray-300 rounded-lg bg-white">
                  <CardNumberElement
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#424770',
                          '::placeholder': { color: '#aab7c4' },
                        },
                        invalid: { color: '#9e2146' },
                      },
                    }}
                    onChange={(e) => setCardComplete(e.complete)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Expiry Date</label>
                  <div className="p-3 border border-gray-300 rounded-lg bg-white">
                    <CardExpiryElement
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#424770',
                            '::placeholder': { color: '#aab7c4' },
                          },
                          invalid: { color: '#9e2146' },
                        },
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">CVC</label>
                  <div className="p-3 border border-gray-300 rounded-lg bg-white">
                    <CardCvcElement
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#424770',
                            '::placeholder': { color: '#aab7c4' },
                          },
                          invalid: { color: '#9e2146' },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stripe Charge Timing - Only show when Stripe payment method is selected */}
          {selectedAdminPaymentMethod && selectedAdminPaymentMethod.startsWith('stripe:') && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
              <h4 className="text-sm font-bold text-blue-900 mb-3">Stripe Payment Timing</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-50 transition-colors">
                  <input
                    type="radio"
                    name="stripeTiming"
                    value="immediate"
                    checked={data.stripeChargeTiming === 'immediate'}
                    onChange={(e) => onUpdate({ stripeChargeTiming: 'immediate' })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Charge Now</p>
                    <p className="text-xs text-gray-600">Immediately charge the full amount</p>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-50 transition-colors">
                  <input
                    type="radio"
                    name="stripeTiming"
                    value="authorize"
                    checked={data.stripeChargeTiming === 'authorize' || !data.stripeChargeTiming}
                    onChange={(e) => onUpdate({ stripeChargeTiming: 'authorize' })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Authorize Only (Default)</p>
                    <p className="text-xs text-gray-600">Hold funds, capture later (standard flow)</p>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-50 transition-colors">
                  <input
                    type="radio"
                    name="stripeTiming"
                    value="none"
                    checked={data.stripeChargeTiming === 'none'}
                    onChange={(e) => onUpdate({ stripeChargeTiming: 'none' })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">No Charge</p>
                    <p className="text-xs text-gray-600">Save card only, manual payment later</p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Method Section - For logged-in customers and guests (skip in admin test mode) */}
      {!adminTestMode && !isAdminMode && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-[#185166] mb-4">
            Payment Details
          </h3>
          
          {/* Payment Type Selection - Only show if bank transfer is available */}
          {canUseBankTransfer && (
            <div className="space-y-3 mb-6">
              <p className="text-sm font-medium text-gray-700">Choose payment method:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentType('card')}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    paymentType === 'card' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    paymentType === 'card' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Pay by Card</p>
                    <p className="text-xs text-gray-500">Secure card payment</p>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setPaymentType('bank-transfer')}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    paymentType === 'bank-transfer' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    paymentType === 'bank-transfer' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Bank Transfer</p>
                    <p className="text-xs text-gray-500">Pay via bank</p>
                  </div>
                </button>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            {/* Bank Transfer Selected */}
            {paymentType === 'bank-transfer' && canUseBankTransfer ? (
              <div className={`rounded-2xl border-2 p-6 ${isUrgentBooking ? 'border-orange-300 bg-orange-50' : 'border-amber-200 bg-amber-50'}`}>
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isUrgentBooking ? 'bg-orange-100' : 'bg-amber-100'}`}>
                    <Clock className={`h-6 w-6 ${isUrgentBooking ? 'text-orange-600' : 'text-amber-600'}`} />
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${isUrgentBooking ? 'text-orange-900' : 'text-amber-900'}`}>Bank Transfer Payment</p>
                    <p className={`text-sm mt-1 ${isUrgentBooking ? 'text-orange-700' : 'text-amber-700'}`}>
                      {isUrgentBooking ? (
                        <>Payment must be made <strong>immediately</strong> to confirm your booking as it's within 48 hours.</>
                      ) : (
                        <>Payment must be received at least <strong>48 hours before</strong> your booking date to secure your appointment.</>
                      )}
                    </p>
                  </div>
                </div>
                <div className={`bg-white rounded-lg p-4 border ${isUrgentBooking ? 'border-orange-200' : 'border-amber-200'}`}>
                  <p className="text-sm text-gray-700 mb-2">
                    📲 You will receive an SMS with our bank account details after completing your booking.
                  </p>
                  <p className="text-sm text-gray-600">
                    Please use your booking reference or postcode when making the transfer so we can match your payment.
                  </p>
                </div>
                <div className={`mt-4 flex items-center gap-2 text-sm ${isUrgentBooking ? 'text-orange-700' : 'text-amber-700'}`}>
                  <Shield className="h-4 w-4" />
                  <span>Your booking will be confirmed once payment is received</span>
                </div>
              </div>
            ) : hasPaymentMethods ? (
              // Customer has saved payment method (may be limited info in view-as-client)
              <div className="space-y-4">
                <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-white to-primary/5 p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Saved Payment Method</p>
                      <p className="text-lg font-bold text-gray-900">
                        {defaultPaymentMethod
                          ? `${defaultPaymentMethod.card_brand?.toUpperCase?.() || 'CARD'} •••• ${defaultPaymentMethod.card_last4}`
                          : 'A payment method is saved on file'}
                      </p>
                    </div>
                  </div>
                  {defaultPaymentMethod && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <span>Expires {defaultPaymentMethod.card_exp_month}/{defaultPaymentMethod.card_exp_year}</span>
                    </div>
                  )}
                  <div className="bg-white/80 rounded-lg p-4 border border-primary/10">
                    <p className="text-sm text-gray-700">
                      {isUrgentBooking 
                        ? `💳 £${data.totalCost.toFixed(2)} will be charged to the saved card immediately.`
                        : '✅ Your card is saved. Payment hold will be placed 24 hours before service and charged after completion.'
                      }
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Need to use a different card? You can update it during checkout.
                </p>
              </div>
            ) : guestPaymentMethods.length > 0 && paymentType === 'card' ? (
              // Guest user with saved payment methods found by email
              <div className="space-y-4">
                {/* Welcome back message with saved card */}
                {useGuestSavedCard ? (
                  <div className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                        <Check className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-green-700 font-medium">Welcome back!</p>
                        <p className="text-lg font-bold text-gray-900">
                          {guestPaymentMethods[0]?.card_brand?.toUpperCase?.()} •••• {guestPaymentMethods[0]?.card_last4}
                        </p>
                      </div>
                    </div>
                    {guestPaymentMethods[0] && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <span>Expires {guestPaymentMethods[0].card_exp_month}/{guestPaymentMethods[0].card_exp_year}</span>
                      </div>
                    )}
                    <div className="bg-white/80 rounded-lg p-4 border border-green-200">
                      <p className="text-sm text-gray-700">
                        {isUrgentBooking 
                          ? `💳 £${data.totalCost?.toFixed(2) || '0.00'} will be charged to your saved card immediately.`
                          : '✅ We found your saved card. Payment hold will be placed 24 hours before service and charged after completion.'
                        }
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUseGuestSavedCard(false)}
                      className="mt-4 text-sm text-primary hover:text-primary/80 underline"
                    >
                      Use a different payment method
                    </button>
                  </div>
                ) : (
                  // Show PaymentElement for new card entry
                  <div className="rounded-2xl border-2 border-gray-200 bg-white p-5">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-base font-semibold text-gray-900">New Payment Method</p>
                            <p className="text-xs text-gray-500">
                              {isUrgentBooking 
                                ? `£${data.totalCost?.toFixed(2) || '0.00'} will be charged now`
                                : "Choose your preferred payment method"
                              }
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUseGuestSavedCard(true)}
                          className="text-sm text-primary hover:text-primary/80 underline"
                        >
                          Use saved card
                        </button>
                      </div>
                      
                      {loadingSetupIntent || checkingGuestCustomer ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="ml-2 text-sm text-gray-600">Loading payment options...</span>
                        </div>
                      ) : setupIntentClientSecret && stripePromise ? (
                        <PaymentElementWrapper
                          clientSecret={setupIntentClientSecret}
                          stripePromise={stripePromise}
                          onReady={() => setPaymentElementReady(true)}
                          onComplete={(complete) => setCardComplete(complete)}
                          isUrgentBooking={isUrgentBooking}
                          totalCost={data.totalCost || 0}
                        />
                      ) : !data.email ? (
                        <div className="text-center py-6 text-gray-500">
                          <p className="text-sm">Enter your email above to see payment options</p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="ml-2 text-sm text-gray-600">Preparing payment options...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : paymentType === 'card' ? (
              // No saved payment method - show PaymentElement with all payment options
              <div className="rounded-2xl border-2 border-gray-200 bg-white p-5">
                <div className="space-y-4">
                  {/* Header - compact */}
                  <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-base font-semibold text-gray-900">Payment Method</p>
                      <p className="text-xs text-gray-500">
                        {isUrgentBooking 
                          ? `£${data.totalCost?.toFixed(2) || '0.00'} will be charged now`
                          : "Choose your preferred payment method"
                        }
                      </p>
                    </div>
                  </div>
                  
                  {/* PaymentElement or loading state */}
                  {loadingSetupIntent ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-gray-600">Loading payment options...</span>
                    </div>
                  ) : setupIntentClientSecret && stripePromise ? (
                    <PaymentElementWrapper
                      clientSecret={setupIntentClientSecret}
                      stripePromise={stripePromise}
                      onReady={() => setPaymentElementReady(true)}
                      onComplete={(complete) => setCardComplete(complete)}
                      isUrgentBooking={isUrgentBooking}
                      totalCost={data.totalCost || 0}
                    />
                  ) : !data.email ? (
                    <div className="text-center py-6 text-gray-500">
                      <p className="text-sm">Please enter your email address above to see payment options.</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-gray-600">Preparing secure payment...</span>
                    </div>
                  )}

                  {/* Security badges - compact */}
                  <div className="flex items-center justify-center gap-4 pt-1 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5 text-green-600" />
                      <span>Secure</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CreditCard className="h-3.5 w-3.5 text-blue-600" />
                      <span>Google Pay, Apple Pay & more</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" size="lg" onClick={onBack} disabled={processing || submitting}>
          Back
        </Button>
        <Button
          variant="default"
          size="lg"
          className="px-12"
          onClick={handleSubmit}
          disabled={
            processing ||
            submitting ||
            !canContinue ||
            !paymentRequirementsMet
          }
        >
          {(processing || submitting) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : adminTestMode ? (
            'Create Test Booking (No Payment)'
          ) : paymentType === 'bank-transfer' ? (
            'Complete Booking'
          ) : customerId && defaultPaymentMethod && isUrgentBooking ? (
            `Pay £${data.totalCost.toFixed(2)} & Confirm`
          ) : customerId && defaultPaymentMethod ? (
            'Complete Booking'
          ) : isUrgentBooking ? (
            `Pay £${data.totalCost.toFixed(2)} & Confirm`
          ) : (
            'Complete Booking'
          )}
        </Button>
      </div>

      {/* Full-screen loading overlay when processing booking */}
      {(processing || submitting) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-card shadow-2xl border border-border max-w-sm mx-4 text-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Creating Your Booking</h3>
              <p className="text-muted-foreground text-sm">
                Please wait while we secure your booking. This will only take a moment...
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-4 w-4 text-green-600" />
              <span>Your payment is secure</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { PaymentStep };