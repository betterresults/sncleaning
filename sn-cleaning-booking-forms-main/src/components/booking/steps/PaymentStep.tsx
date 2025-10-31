import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookingData } from '../BookingForm';
import { CreditCard, Shield, Loader2 } from 'lucide-react';
import { useAirbnbBookingSubmit } from '@/hooks/useAirbnbBookingSubmit';
import { useNavigate } from 'react-router-dom';
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
        <h2 className="text-2xl font-bold text-[#185166] mb-8">
          Your Details & Payment
        </h2>
      </div>

      {/* Contact Information Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-[#185166]">
          Contact Information
        </h3>
        
        <div className="grid grid-cols-2 gap-6">
          <Input
            placeholder="First Name *"
            value={data.firstName || ''}
            onChange={(e) => onUpdate({ firstName: e.target.value })}
            className="h-14 text-base"
          />
          <Input
            placeholder="Last Name *"
            value={data.lastName || ''}
            onChange={(e) => onUpdate({ lastName: e.target.value })}
            className="h-14 text-base"
          />
        </div>
        
        <Input
          type="email"
          placeholder="Email Address *"
          value={data.email || ''}
          onChange={(e) => onUpdate({ email: e.target.value })}
          className="h-14 text-base"
        />
        
        <Input
          type="tel"
          placeholder="Phone Number *"
          value={data.phone || ''}
          onChange={(e) => onUpdate({ phone: e.target.value })}
          className="h-14 text-base"
        />
        
        <Input
          placeholder="Street Address *"
          value={data.street || ''}
          onChange={(e) => onUpdate({ street: e.target.value })}
          className="h-14 text-base"
        />
        
        <Input
          placeholder="Postcode *"
          value={data.postcode || ''}
          onChange={(e) => onUpdate({ postcode: e.target.value })}
          className="h-14 text-base"
        />
      </div>

      {/* Payment Method Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-[#185166]">
          Add Payment Method
        </h3>
        
        <div className="bg-card border border-border rounded-xl p-8">
          <div className="mb-6">
            <p className="text-base text-[#185166] font-medium mb-2">
              To confirm your card
            </p>
            <p className="text-sm text-muted-foreground">
              {isUrgentBooking 
                ? `Payment will be collected now - £${data.totalCost.toFixed(2)}`
                : `Payment will be collected later. We'll perform a £1 verification (immediately released).`
              }
            </p>
          </div>
          
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: 'hsl(var(--foreground))',
                  '::placeholder': {
                    color: 'hsl(var(--muted-foreground))',
                  },
                  padding: '12px',
                },
              },
            }}
          />
          
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span>PCI Compliant</span>
            </div>
          </div>
        </div>
      </div>

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
          disabled={!stripe || processing || submitting || !canContinue}
        >
          {(processing || submitting) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
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