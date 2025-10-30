import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BookingData } from '../BookingForm';
import { CreditCard, Shield, Clock, Loader2 } from 'lucide-react';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useAirbnbBookingSubmit } from '@/hooks/useAirbnbBookingSubmit';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

interface PaymentStepProps {
  data: BookingData;
  onBack: () => void;
}

// Initialize Stripe (you'll need to add your Stripe publishable key)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const PaymentForm: React.FC<{ data: BookingData; onBack: () => void }> = ({ data, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { paymentMethods, loading: loadingMethods } = usePaymentMethods();
  const { submitBooking, loading: submitting } = useAirbnbBookingSubmit();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('new');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      return;
    }

    try {
      setProcessing(true);

      let paymentMethodId: string | undefined;

      if (selectedPaymentMethod === 'new') {
        // Create new payment method from Stripe Elements
        const { error: submitError } = await elements.submit();
        if (submitError) {
          throw new Error(submitError.message);
        }

        const { error, paymentMethod } = await stripe.createPaymentMethod({
          elements,
        });

        if (error || !paymentMethod) {
          throw new Error(error?.message || 'Failed to create payment method');
        }

        paymentMethodId = paymentMethod.id;
      } else {
        // Use existing payment method
        paymentMethodId = selectedPaymentMethod;
      }

      // Submit booking with payment method
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
      }, paymentMethodId);

      if (result.success) {
        navigate('/booking-confirmation', { state: { bookingId: result.bookingId } });
      }
    } catch (error: any) {
      console.error('Payment error:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Payment
        </h2>
        <p className="text-muted-foreground">
          Complete your booking with secure payment processing.
        </p>
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
                  <div className="mt-3">
                    <PaymentElement />
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
          disabled={!stripe || processing || submitting || loadingMethods}
        >
          {(processing || submitting) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay £${data.totalCost.toFixed(2)} & Confirm Booking`
          )}
        </Button>
      </div>
    </div>
  );
};

const PaymentStep: React.FC<PaymentStepProps> = ({ data, onBack }) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm data={data} onBack={onBack} />
    </Elements>
  );
};

export { PaymentStep };