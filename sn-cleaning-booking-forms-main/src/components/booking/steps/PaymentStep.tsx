import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookingData } from '../BookingForm';
import { CreditCard, Shield, Clock, Loader2, AlertCircle } from 'lucide-react';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useAirbnbBookingSubmit } from '@/hooks/useAirbnbBookingSubmit';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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
  const { paymentMethods, loading: loadingMethods } = usePaymentMethods();
  const { submitBooking, loading: submitting } = useAirbnbBookingSubmit();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('new');
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

      let paymentMethodId: string | undefined;

      if (selectedPaymentMethod === 'new') {
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

        paymentMethodId = paymentMethod.id;
      } else {
        // Use existing payment method
        paymentMethodId = selectedPaymentMethod;
      }

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
        <h2 className="text-2xl font-bold text-[#185166] mb-4">
          Your Details & Payment
        </h2>
        <p className="text-muted-foreground">
          Complete your details and payment information.
        </p>
      </div>

      {/* Customer Details Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Contact Information
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="First name"
                value={data.firstName || ''}
                onChange={(e) => onUpdate({ firstName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Last name"
                value={data.lastName || ''}
                onChange={(e) => onUpdate({ lastName: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={data.email || ''}
              onChange={(e) => onUpdate({ email: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+44 7xxx xxxxxx"
              value={data.phone || ''}
              onChange={(e) => onUpdate({ phone: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="address">Full Address *</Label>
            <Input
              id="address"
              placeholder="Street address"
              value={data.street || ''}
              onChange={(e) => onUpdate({ street: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="postcode">Postcode *</Label>
            <Input
              id="postcode"
              placeholder="SW1A 1AA"
              value={data.postcode || ''}
              onChange={(e) => onUpdate({ postcode: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Payment Information Notice */}
      <div className={`bg-card border rounded-lg p-4 ${isUrgentBooking ? 'border-orange-500/50 bg-orange-500/5' : 'border-blue-500/50 bg-blue-500/5'}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isUrgentBooking ? 'text-orange-500' : 'text-blue-500'}`} />
          <div className="flex-1">
            {isUrgentBooking ? (
              <>
                <h4 className="font-semibold text-foreground mb-1">⚠️ Payment Required Now</h4>
                <p className="text-sm text-muted-foreground">
                  Your booking is within 3 days. Payment of <span className="font-semibold text-foreground">£{data.totalCost.toFixed(2)}</span> will be collected immediately to confirm your booking.
                </p>
              </>
            ) : (
              <>
                <h4 className="font-semibold text-foreground mb-1">🔒 Card Verification</h4>
                <p className="text-sm text-muted-foreground">
                  We'll perform a quick £1 verification (immediately released) to confirm your card can hold <span className="font-semibold text-foreground">£{data.totalCost.toFixed(2)}</span>. No payment will be collected now.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Select Payment Method
        </h3>
        
        {loadingMethods ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
            {/* Existing Payment Methods */}
            {paymentMethods.length > 0 && (
              <div className="space-y-3 mb-4">
                {paymentMethods.map((pm) => (
                  <div key={pm.id} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-accent transition-colors">
                    <RadioGroupItem value={pm.stripe_payment_method_id} id={pm.id} />
                    <Label htmlFor={pm.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span className="font-medium">{pm.card_brand.toUpperCase()}</span>
                        <span className="text-muted-foreground">•••• {pm.card_last4}</span>
                        <span className="text-sm text-muted-foreground">
                          Exp {pm.card_exp_month}/{pm.card_exp_year}
                        </span>
                        {pm.is_default && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Default</span>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {/* New Payment Method */}
            <div className="flex items-start space-x-3 p-3 border border-border rounded-lg hover:bg-accent transition-colors">
              <RadioGroupItem value="new" id="new" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="new" className="cursor-pointer font-medium mb-3 block">
                  Add New Payment Method
                </Label>
                {selectedPaymentMethod === 'new' && (
                  <div className="mt-3 p-4 border border-border rounded-lg bg-background">
                    <CardElement
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: 'hsl(var(--foreground))',
                            '::placeholder': {
                              color: 'hsl(var(--muted-foreground))',
                            },
                          },
                        },
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </RadioGroup>
        )}

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4 text-primary" />
            <span>PCI Compliant</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span>Instant Confirmation</span>
          </div>
        </div>
      </div>

      {/* Booking Summary */}
      <div className="bg-accent rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Booking Summary
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Property:</span>
            <span className="font-medium">{data.propertyType} - {data.bedrooms} bedrooms, {data.bathrooms} bathrooms</span>
          </div>
          <div className="flex justify-between">
            <span>Service:</span>
            <span className="font-medium">{data.serviceType?.replace('-', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span>Date & Time:</span>
            <span className="font-medium">
              {data.selectedDate?.toLocaleDateString('en-GB')} at {data.selectedTime}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Estimated Hours:</span>
            <span className="font-medium">{data.estimatedHours + data.extraHours} hours</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total Cost:</span>
              <span className="text-primary">£{data.totalCost.toFixed(2)}</span>
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
          disabled={!stripe || processing || submitting || loadingMethods || !canContinue}
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