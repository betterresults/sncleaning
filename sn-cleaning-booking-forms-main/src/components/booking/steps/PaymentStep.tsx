import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookingData } from '../BookingForm';
import { CreditCard, Shield, Loader2, AlertTriangle } from 'lucide-react';
import { useAirbnbBookingSubmit } from '@/hooks/useAirbnbBookingSubmit';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentStepProps {
  data: BookingData;
  onUpdate: (updates: Partial<BookingData>) => void;
  onBack: () => void;
}

const PaymentStep: React.FC<PaymentStepProps> = ({ data, onUpdate, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { submitBooking, loading: submitting } = useAirbnbBookingSubmit();
  const [processing, setProcessing] = useState(false);
  const [searchParams] = useSearchParams();
  
  // Admin testing mode - skip payment if URL has ?adminTest=true
  const adminTestMode = searchParams.get('adminTest') === 'true';

  // Calculate if booking is urgent (within 72 hours)
  const isUrgentBooking = useMemo(() => {
    if (!data.selectedDate || !data.selectedTime) return false;
    
    const bookingDateTime = new Date(
      `${data.selectedDate.toISOString().split('T')[0]}T${data.selectedTime}:00`
    );
    const hoursUntilBooking = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntilBooking <= 72;
  }, [data.selectedDate, data.selectedTime]);

  const handleSubmit = async () => {
    // Admin test mode - skip payment completely
    if (adminTestMode) {
      try {
        setProcessing(true);
        
        const result = await submitBooking({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          houseNumber: data.houseNumber,
          street: data.street,
          postcode: data.postcode,
          city: data.city,
          propertyAccess: data.propertyAccess,
          accessNotes: data.accessNotes,
          propertyType: data.propertyType,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          serviceType: data.serviceType,
          selectedDate: data.selectedDate,
          selectedTime: data.selectedTime,
          totalCost: data.totalCost,
          estimatedHours: data.estimatedHours,
          hourlyRate: data.hourlyRate,
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

    // Normal payment flow
    if (!stripe || !elements) {
      return;
    }

    try {
      setProcessing(true);

      // Create new payment method from CardElement
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
        },
      });

      if (error || !paymentMethod) {
        throw new Error(error?.message || 'Failed to create payment method');
      }

      const paymentMethodId = paymentMethod.id;

      // Submit booking with skipPaymentAuth=true
      const result = await submitBooking({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        houseNumber: data.houseNumber,
        street: data.street,
        postcode: data.postcode,
        city: data.city,
        propertyAccess: data.propertyAccess,
        accessNotes: data.accessNotes,
        propertyType: data.propertyType,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        serviceType: data.serviceType,
        selectedDate: data.selectedDate,
        selectedTime: data.selectedTime,
        totalCost: data.totalCost,
        estimatedHours: data.estimatedHours,
        hourlyRate: data.hourlyRate,
        notes: data.notes,
        additionalDetails: data
      }, true);

      if (!result.success || !result.customerId || !result.bookingId) {
        throw new Error('Failed to create booking');
      }

      // Step 1: Verify payment method and attach to customer
      const verifyAmountInPence = isUrgentBooking ? 0 : 100;
      const { data: verifyResult, error: verifyError } = await supabase.functions.invoke(
        'stripe-verify-payment-method',
        {
          body: {
            customerId: result.customerId,
            paymentMethodId,
            verifyAmountInPence,
            totalAmountInPence: Math.round(data.totalCost * 100)
          }
        }
      );

      if (verifyError || !verifyResult?.success) {
        throw new Error(verifyResult?.error || 'Card verification failed');
      }

      // Step 2: For urgent bookings, charge immediately
      if (isUrgentBooking) {
        const { data: chargeResult, error: chargeError } = await supabase.functions.invoke(
          'system-payment-action',
          {
            body: {
              bookingId: result.bookingId,
              action: 'charge',
              paymentMethodId
            }
          }
        );

        if (chargeError || !chargeResult?.success) {
          throw new Error(chargeResult?.error || 'Payment failed');
        }

        toast({
          title: "Payment Successful",
          description: `£${data.totalCost.toFixed(2)} has been charged to your card.`
        });
      } else {
        toast({
          title: "Card Verified",
          description: "Your card has been verified. No payment collected now."
        });
      }

      navigate('/booking-confirmation', { state: { bookingId: result.bookingId } });
      
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
      <div>
        <h2 className="text-3xl font-bold text-[#185166]">
          Secure Booking
        </h2>
      </div>

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
        <h3 className="text-2xl font-bold text-[#185166]">
          Your Details
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <Input
            placeholder="First Name"
            value={data.firstName || ''}
            onChange={(e) => onUpdate({ firstName: e.target.value })}
            className="h-14 text-base rounded-xl border-2 border-gray-300 focus:border-[#185166] transition-colors"
          />
          <Input
            placeholder="Last Name"
            value={data.lastName || ''}
            onChange={(e) => onUpdate({ lastName: e.target.value })}
            className="h-14 text-base rounded-xl border-2 border-gray-300 focus:border-[#185166] transition-colors"
          />
        </div>
        
        <Input
          type="email"
          placeholder="Email Address"
          value={data.email || ''}
          onChange={(e) => onUpdate({ email: e.target.value })}
          className="h-14 text-base rounded-xl border-2 border-gray-300 focus:border-[#185166] transition-colors"
        />
        
        <Input
          type="tel"
          placeholder="Phone Number"
          value={data.phone || ''}
          onChange={(e) => onUpdate({ phone: e.target.value })}
          className="h-14 text-base rounded-xl border-2 border-gray-300 focus:border-[#185166] transition-colors"
        />
      </div>

      {/* Booking Address Section */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-[#185166]">
          Booking Address
        </h3>
        
        <Input
          placeholder="Street Address"
          value={data.street || ''}
          onChange={(e) => onUpdate({ street: e.target.value })}
          className="h-14 text-base rounded-xl border-2 border-gray-300 focus:border-[#185166] transition-colors"
        />
        
        <div className="grid grid-cols-2 gap-4">
          <Input
            placeholder="Postcode"
            value={data.postcode || ''}
            onChange={(e) => onUpdate({ postcode: e.target.value })}
            className="h-14 text-base rounded-xl border-2 border-gray-300 focus:border-[#185166] transition-colors"
          />
          
          <Input
            placeholder="City"
            value={data.city || ''}
            onChange={(e) => onUpdate({ city: e.target.value })}
            className="h-14 text-base rounded-xl border-2 border-gray-300 focus:border-[#185166] transition-colors"
          />
        </div>
      </div>

      {/* Payment Method Section - Skip in admin test mode */}
      {!adminTestMode && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-[#185166]">
            Payment Details
          </h3>
        
          <div className="p-8 rounded-2xl shadow-[0_10px_28px_rgba(0,0,0,0.18)] bg-white transition-shadow duration-300 hover:shadow-[0_15px_35px_rgba(0,0,0,0.22)]">
            <div className="mb-8">
              <p className="text-lg text-[#185166] font-semibold mb-3">
                {isUrgentBooking ? 'Payment Information' : 'Card Verification'}
              </p>
              <p className="text-base text-gray-600 leading-relaxed">
                {isUrgentBooking 
                  ? `Payment will be collected now - £${data.totalCost.toFixed(2)}`
                  : 'We will verify your card with a £1 temporary hold (immediately released). No payment will be collected now.'
                }
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-8 transition-all duration-200 hover:border-[#185166]">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '18px',
                      color: '#1e293b',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      '::placeholder': {
                        color: '#94a3b8',
                      },
                      padding: '16px',
                      lineHeight: '24px',
                    },
                    invalid: {
                      color: '#dc2626',
                    },
                  },
                }}
              />
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-8 text-base text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#185166]" />
                <span className="font-medium">Secure Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#185166]" />
                <span className="font-medium">PCI Compliant</span>
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
          disabled={!stripe || processing || submitting || !canContinue || (adminTestMode ? false : !stripe)}
        >
          {(processing || submitting) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : adminTestMode ? (
            'Create Test Booking (No Payment)'
          ) : isUrgentBooking ? (
            `Pay £${data.totalCost.toFixed(2)} & Confirm`
          ) : (
            `Verify Card & Confirm Booking`
          )}
        </Button>
      </div>
    </div>
  );
};

export { PaymentStep };