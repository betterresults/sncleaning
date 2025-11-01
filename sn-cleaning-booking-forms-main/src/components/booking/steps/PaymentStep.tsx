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
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

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
  const stripe = useStripe();
  const elements = useElements();
  const [cardComplete, setCardComplete] = useState(false);
  
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
        // No saved payment method - use CardElement to create payment method
        if (!stripe || !elements) {
          throw new Error('Stripe not loaded');
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error('Card information is incomplete');
        }

        // Submit booking first
        const result = await submitBooking(bookingPayload, true);

        console.log('[PaymentStep] submitBooking result (no default PM):', result);

        if (!result.success || !result.customerId || !result.bookingId) {
          throw new Error('Failed to create booking');
        }

        // Create payment method with card element
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
          throw new Error(pmError?.message || 'Failed to create payment method');
        }

        // Verify & attach payment method using existing backend flow
        const verifyAmount = isUrgentBooking ? 0 : 100; // £1 verification for non-urgent
        const totalAmount = Math.round((data.totalCost || 0) * 100);

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

        if (verifyError || verifyResult?.success === false) {
          throw new Error(verifyResult?.error || 'Failed to verify card');
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
            title: "Card Added Successfully",
            description: "Your booking has been confirmed. Payment will be processed 3 days before the cleaning date."
          });
        }

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
                <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-white to-primary/5 p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Saved Payment Method</p>
                      <p className="text-lg font-bold text-gray-900">
                        {defaultPaymentMethod.card_brand.toUpperCase()} •••• {defaultPaymentMethod.card_last4}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <span>Expires {defaultPaymentMethod.card_exp_month}/{defaultPaymentMethod.card_exp_year}</span>
                  </div>
                  <div className="bg-white/80 rounded-lg p-4 border border-primary/10">
                    <p className="text-sm text-gray-700">
                      {isUrgentBooking 
                        ? `💳 £${data.totalCost.toFixed(2)} will be charged to this card immediately.`
                        : '✅ Your card is saved. Payment will be processed 3 days before the cleaning date.'
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
            
            <div className="flex items-center justify-center gap-6 text-xs text-gray-400 pt-2">
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3" />
                <span>256-bit SSL encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3" />
                <span>PCI DSS compliant</span>
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
          disabled={processing || submitting || !canContinue || (!customerId && !cardComplete && !adminTestMode) || (!customerId && !defaultPaymentMethod && !stripe)}
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
  );
};

export { PaymentStep };