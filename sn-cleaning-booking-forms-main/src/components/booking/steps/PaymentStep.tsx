import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '../../../../phone-input';
import { BookingData } from '../BookingForm';
import { CreditCard, Shield, Loader2, AlertTriangle } from 'lucide-react';
import { useAirbnbBookingSubmit } from '@/hooks/useAirbnbBookingSubmit';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

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
  data: BookingData;
  onUpdate: (updates: Partial<BookingData>) => void;
  onBack: () => void;
}

const PaymentStep: React.FC<PaymentStepProps> = ({ data, onUpdate, onBack }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, customerId, paymentMethods, loading: loadingPaymentMethods } = useSimpleAuth();
  const { submitBooking, loading: submitting } = useAirbnbBookingSubmit();
  const [processing, setProcessing] = useState(false);
  const [searchParams] = useSearchParams();
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  // Admin testing mode - skip payment if URL has ?adminTest=true
  const adminTestMode = searchParams.get('adminTest') === 'true';

  // Get default payment method if available (only for customers)
  const defaultPaymentMethod = customerId && paymentMethods.length > 0 
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

            toast({
              title: "Payment Successful",
              description: `£${data.totalCost.toFixed(2)} has been charged.`
            });
          } else {
            toast({
              title: "Card Added",
              description: "Your payment method has been saved successfully."
            });
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
          // Customer details
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          
          // Property address
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
          needsOvenCleaning: data.needsOvenCleaning,
          ovenType: data.ovenType,
          cleaningProducts: data.cleaningProducts,
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
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
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
        needsOvenCleaning: data.needsOvenCleaning,
        ovenType: data.ovenType,
        cleaningProducts: data.cleaningProducts,
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

          toast({
            title: "Payment Successful",
            description: `£${data.totalCost.toFixed(2)} has been charged.`
          });
        } else {
          toast({
            title: "Booking Confirmed",
            description: "Your booking has been confirmed. Payment will be processed later."
          });
        }

        navigate('/booking-confirmation', { state: { bookingId: result.bookingId } });
      } else {
        // No saved payment method - submit booking first, then redirect to Stripe
        const result = await submitBooking(bookingPayload, true);

        console.log('[PaymentStep] submitBooking result (no default PM):', result);

        if (!result.success || !result.customerId || !result.bookingId) {
          throw new Error('Failed to create booking');
        }

        // Call stripe-collect-payment-method
        const returnUrl = `${window.location.origin}/airbnb?payment_setup=success&bookingId=${result.bookingId}&urgent=${isUrgentBooking ? '1' : '0'}`;
        const cancelUrl = `${window.location.origin}/airbnb?payment_setup=cancelled`;

        const { data: collectResult, error: collectError } = await supabase.functions.invoke(
          'stripe-collect-payment-method',
          {
            body: {
              customer_id: result.customerId,
              customer_email: data.email,
              customer_name: `${data.firstName} ${data.lastName}`,
              return_url: returnUrl,
              cancel_url: cancelUrl,
              collect_only: true
            }
          }
        );

        if (collectError || !collectResult?.checkout_url) {
          throw new Error(collectResult?.error || 'Failed to setup payment');
        }

        // Redirect to Stripe Checkout
        window.location.href = collectResult.checkout_url;
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
    <div className="space-y-8">
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

      {/* Your Details Section */}
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

      {/* Booking Address Section */}
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

      {/* Payment Method Section - Skip in admin test mode */}
      {!adminTestMode && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-[#185166] mb-4">
            Payment Details
          </h3>
          
          <div className="space-y-4">
            {customerId && defaultPaymentMethod ? (
              // Customer has saved payment method
              <div className="space-y-4">
                <div className="rounded-2xl border-2 border-gray-200 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-6 w-6 text-[#185166]" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {defaultPaymentMethod.card_brand.toUpperCase()} •••• {defaultPaymentMethod.card_last4}
                        </p>
                        <p className="text-sm text-gray-600">
                          Expires {defaultPaymentMethod.card_exp_month}/{defaultPaymentMethod.card_exp_year}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    {isUrgentBooking 
                      ? `£${data.totalCost.toFixed(2)} will be charged to this card.`
                      : 'No payment will be collected now. Your card will be charged later.'
                    }
                  </p>
                </div>
                <p className="text-sm text-gray-500 text-center">
                  or add a different card during checkout
                </p>
              </div>
            ) : (
              // No saved payment method - will redirect to Stripe
              <div className="rounded-2xl border-2 border-gray-200 bg-white p-6">
                <div className="flex items-center gap-3 mb-3">
                  <CreditCard className="h-6 w-6 text-[#185166]" />
                  <p className="font-medium text-gray-900">Add Payment Method</p>
                </div>
                <p className="text-base text-gray-600">
                  {isUrgentBooking 
                    ? `Payment of £${data.totalCost.toFixed(2)} will be collected securely through Stripe.`
                    : 'You will be redirected to securely add your payment method. No payment will be collected now.'
                  }
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-start gap-6 text-sm text-gray-500 pt-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#185166]" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#185166]" />
                <span>PCI Compliant</span>
              </div>
            </div>
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
          disabled={processing || submitting || !canContinue}
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
          ) : (
            'Continue to Secure Payment'
          )}
        </Button>
      </div>
    </div>
  );
};

export { PaymentStep };