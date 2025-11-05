import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '../../../../phone-input';
import { BookingData } from '../AirbnbBookingForm';
import { CreditCard, Shield, Loader2, AlertTriangle } from 'lucide-react';
import { useAirbnbBookingSubmit } from '@/hooks/useAirbnbBookingSubmit';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import CustomerSelector from '@/components/booking/CustomerSelector';
import AddressSelector from '@/components/booking/AddressSelector';
import { usePaymentMethodCheck } from '@/hooks/usePaymentMethodCheck';
import { useAdminCustomer } from '@/contexts/AdminCustomerContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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

interface PaymentStepProps {
  data: BookingData | any;
  onUpdate: (updates: Partial<BookingData> | any) => void;
  onBack: () => void;
  isAdminMode?: boolean;
  formType?: 'airbnb' | 'linen';
  bookingSummary?: React.ReactNode;
}

const PaymentStep: React.FC<PaymentStepProps> = ({ 
  data, 
  onUpdate, 
  onBack, 
  isAdminMode = false, 
  formType = 'airbnb',
  bookingSummary 
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, customerId, paymentMethods, loading: loadingPaymentMethods } = useSimpleAuth();
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
const [editDetails, setEditDetails] = useState(false);
  
// Use admin-selected customerId or logged-in/selected customerId
const { selectedCustomerId } = useAdminCustomer();
const effectiveCustomerId = isAdminMode ? data.customerId : (customerId || selectedCustomerId || null);
console.log('[PaymentStep] ID context', { isAdminMode, customerId, selectedCustomerId, effectiveCustomerId });
const { hasPaymentMethods, loading: checkingPaymentMethods } = usePaymentMethodCheck(effectiveCustomerId || null);
  
// Admin testing mode - skip payment if URL has ?adminTest=true
const adminTestMode = searchParams.get('adminTest') === 'true';

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

  // Get default payment method if available (only for logged-in customers or admin-selected)
  const defaultPaymentMethod = effectiveCustomerId && paymentMethods.length > 0 
    ? (paymentMethods.find((pm: any) => pm.is_default) || paymentMethods[0])
    : null;

  // Calculate if booking is urgent (within 72 hours)
  const isUrgentBooking = useMemo(() => {
    if (!data.selectedDate || !data.selectedTime) return false;
    
    const bookingDateTime = new Date(
      `${data.selectedDate.toISOString().split('T')[0]}T${data.selectedTime}:00`
    );
    const hoursUntilBooking = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntilBooking <= 72;
  }, [data.selectedDate, data.selectedTime]);

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

          // Navigate to confirmation
          navigate(`/booking-confirmation?bookingId=${bookingId}`, { replace: true });
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
          serviceType: data.serviceType,
          alreadyCleaned: data.alreadyCleaned,
          ovenType: data.ovenType,
          cleaningProducts: data.cleaningProducts.join(','),
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
          
          // Notes
          notes: data.notes,
          additionalDetails: data
        }, true);

        if (!result.success || !result.bookingId) {
          throw new Error('Failed to create booking');
        }

        toast({
          title: "Test Booking Created",
          description: "Admin test mode - payment skipped"
        });

        navigate('/booking-confirmation', { state: { bookingId: result.bookingId } });
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
        serviceType: data.serviceType,
        alreadyCleaned: data.alreadyCleaned,
        ovenType: data.ovenType,
        cleaningProducts: data.cleaningProducts.join(','),
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
        notes: data.notes,
        additionalDetails: data
      };

      // If user is a customer with saved payment method
      if (customerId && defaultPaymentMethod) {
        // Submit booking first
        const result = await submitBooking(bookingPayload, true);

        console.log('[PaymentStep] submitBooking result (has default PM):', result);

        if (!result.success || !result.bookingId) {
          throw new Error('Failed to create booking');
        }

        // For urgent bookings, charge immediately
        if (isUrgentBooking) {
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
            throw new Error(chargeResult?.error || 'Payment failed');
          }
        }

        navigate('/booking-confirmation', { state: { bookingId: result.bookingId } });
      } else {
        // No saved payment method - use CardElement to create payment method
        console.log('[PaymentStep] No saved payment method, using CardElement');
        
        if (!stripe || !elements) {
          console.error('[PaymentStep] Stripe/Elements not loaded:', { stripe: !!stripe, elements: !!elements });
          throw new Error('Stripe not loaded');
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          console.error('[PaymentStep] CardElement not found');
          throw new Error('Card information is incomplete');
        }

        console.log('[PaymentStep] Submitting booking...');
        const result = await submitBooking(bookingPayload, true);

        console.log('[PaymentStep] submitBooking result:', result);

        if (!result.success || !result.customerId || !result.bookingId) {
          console.error('[PaymentStep] Booking submission failed:', result);
          throw new Error('Failed to create booking');
        }

        console.log('[PaymentStep] Creating payment method with Stripe...');
        const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: {
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
            phone: data.phone,
          },
        });

        if (pmError || !paymentMethod) {
          console.error('[PaymentStep] Payment method creation failed:', pmError);
          throw new Error(pmError?.message || 'Failed to create payment method');
        }

        console.log('[PaymentStep] Payment method created:', paymentMethod.id);

        // Verify & attach payment method using existing backend flow
        const verifyAmount = isUrgentBooking ? 0 : 100; // £1 verification for non-urgent
        const totalAmount = Math.round((data.totalCost || 0) * 100);

        console.log('[PaymentStep] Verifying payment method...', {
          customerId: result.customerId,
          paymentMethodId: paymentMethod.id,
          verifyAmount,
          totalAmount,
          isUrgent: isUrgentBooking
        });

        const { data: verifyResult, error: verifyError } = await supabase.functions.invoke(
          'stripe-verify-payment-method',
          {
            body: {
              customerId: result.customerId,
              paymentMethodId: paymentMethod.id,
              verifyAmountInPence: verifyAmount,
              totalAmountInPence: totalAmount,
            }
          }
        );

        console.log('[PaymentStep] Verify result:', { verifyResult, verifyError });

        if (verifyError || verifyResult?.success === false) {
          console.error('[PaymentStep] Payment verification failed:', { verifyError, verifyResult });
          throw new Error(verifyResult?.error || 'Failed to verify card');
        }

        // For urgent bookings, charge immediately
        if (isUrgentBooking) {
          console.log('[PaymentStep] Urgent booking - charging immediately...');
          const { data: chargeResult, error: chargeError } = await supabase.functions.invoke(
            'system-payment-action',
            {
              body: {
                bookingId: result.bookingId,
                action: 'charge'
              }
            }
          );

          console.log('[PaymentStep] Charge result:', { chargeResult, chargeError });

          if (chargeError || !chargeResult?.success) {
            console.error('[PaymentStep] Payment charge failed:', { chargeError, chargeResult });
            throw new Error(chargeResult?.error || 'Payment failed');
          }
        }

        console.log('[PaymentStep] Navigating to confirmation...');
        navigate('/booking-confirmation', { state: { bookingId: result.bookingId } });
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Form - Takes 2 columns */}
      <div className="lg:col-span-2 space-y-8">
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

      {/* Customer Details - Admin (editable when a customer is selected) */}
      {isAdminMode && data.customerId && (
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
              placeholder="Phone number"
              className={`h-16 text-lg rounded-2xl border-2 bg-white focus:border-[#185166] focus:ring-0 px-6 font-medium transition-all duration-200 placeholder:text-gray-400 ${phoneError ? 'border-red-500' : 'border-gray-200'}`}
            />
            {phoneError && (
              <p className="text-xs text-red-600 font-medium mt-1">{phoneError}</p>
            )}
          </div>
        </div>
      )}

      {/* Customer Details - Customer mode (read-only) */}
      {!isAdminMode && user && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-[#185166] mb-2">Your Details</h3>
          <div className="rounded-2xl border-2 border-gray-200 bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-gray-900">{`${data.firstName || ''} ${data.lastName || ''}`.trim()}</p>
                <p className="text-sm text-gray-600">{data.email || '—'}</p>
                <p className="text-sm text-gray-600">{data.phone || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Guest Mode - show customer details */}
      {!isAdminMode && !user && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-[#185166] mb-4">
            Your Details
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
              placeholder="Phone number"
              className={`h-16 text-lg rounded-2xl border-2 bg-white focus:border-[#185166] focus:ring-0 px-6 font-medium transition-all duration-200 placeholder:text-gray-400 ${phoneError ? 'border-red-500' : 'border-gray-200'}`}
            />
            {phoneError && (
              <p className="text-xs text-red-600 font-medium mt-1">{phoneError}</p>
            )}
          </div>
        </div>
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
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-[#185166] mb-4">
            Booking Address
          </h3>
          
          <Input
            placeholder="Street Address"
            value={data.street || ''}
            onChange={(e) => onUpdate({ street: e.target.value })}
            className="h-16 text-lg rounded-2xl border-2 border-gray-200 bg-white focus:border-[#185166] focus:ring-0 px-6 font-medium transition-all duration-200 placeholder:text-gray-400"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Postcode"
              value={data.postcode || ''}
              onChange={(e) => onUpdate({ postcode: e.target.value })}
              className="h-16 text-lg rounded-2xl border-2 border-gray-200 bg-white focus:border-[#185166] focus:ring-0 px-6 font-medium transition-all duration-200 placeholder:text-gray-400"
            />
            
            <Input
              placeholder="City"
              value={data.city || ''}
              onChange={(e) => onUpdate({ city: e.target.value })}
              className="h-16 text-lg rounded-2xl border-2 border-gray-200 bg-white focus:border-[#185166] focus:ring-0 px-6 font-medium transition-all duration-200 placeholder:text-gray-400"
            />
          </div>
        </div>
      )}

      {/* ADMIN MODE: Payment Method Selection */}
      {isAdminMode && data.customerId && !checkingPaymentMethods && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-[#185166] mb-4">
            Payment Method
          </h3>
          
          <div className="space-y-4">
            <Select
              value={selectedAdminPaymentMethod || data.paymentMethod || ''}
              onValueChange={(value) => {
                setSelectedAdminPaymentMethod(value);
                onUpdate({ paymentMethod: value });
              }}
            >
              <SelectTrigger className="h-16 text-lg rounded-2xl border-2 border-gray-200 bg-white">
                <SelectValue placeholder="Choose payment method..." />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {/* Saved Customer Cards */}
                {hasPaymentMethods && paymentMethods.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Saved Cards
                    </div>
                    {paymentMethods.map((pm: any) => (
                      <SelectItem key={pm.stripe_payment_method_id} value={`stripe:${pm.stripe_payment_method_id}`}>
                        {pm.card_brand?.toUpperCase?.()} •••• {pm.card_last4} (Exp: {pm.card_exp_month}/{pm.card_exp_year})
                        {pm.is_default && ' ⭐'}
                      </SelectItem>
                    ))}
                    {companyPaymentMethods.length > 0 && (
                      <div className="border-t my-1" />
                    )}
                  </>
                )}
                
                {/* Company Payment Methods */}
                {companyPaymentMethods.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Other Methods
                    </div>
                    {companyPaymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            
            {hasPaymentMethods ? (
              <p className="text-sm text-gray-600">
                💳 Customer has {paymentMethods.length} saved card{paymentMethods.length !== 1 ? 's' : ''}. Select preferred payment method above.
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                ⚠️ Customer has no saved payment methods. Please select payment method above.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Payment Method Section - For logged-in customers and guests (skip in admin test mode) */}
      {!adminTestMode && !isAdminMode && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-[#185166] mb-4">
            Payment Details
          </h3>
          
          <div className="space-y-4">
            {hasPaymentMethods ? (
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
            ) : (
              // No saved payment method - show CardElement directly
              <div className="rounded-2xl border-2 border-gray-200 bg-white p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">Enter Card Details</p>
                      <p className="text-sm text-gray-600">
                        {isUrgentBooking 
                          ? `Enter your card details to pay £${data.totalCost.toFixed(2)}`
                          : "Enter your card details. No charge will be made now."
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                    <CardElement 
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#1f2937',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            '::placeholder': {
                              color: '#9ca3af',
                            },
                            iconColor: '#185166',
                          },
                          invalid: {
                            color: '#ef4444',
                            iconColor: '#ef4444',
                          },
                        },
                      }}
                      onChange={(e) => setCardComplete(e.complete)}
                    />
                  </div>

                  <div className="flex items-center justify-center gap-4 pt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span>Bank-level security</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <span>All major cards</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
            (!hasPaymentMethods && !adminTestMode && (!stripe || !cardComplete))
          }
        >
          {(processing || submitting) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : adminTestMode ? (
            'Create Test Booking (No Payment)'
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
      </div>

      {/* Sidebar - Booking Summary */}
      <div className="lg:col-span-1">
        {bookingSummary}
      </div>
    </div>
  );
};

export { PaymentStep };