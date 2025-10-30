import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BookingData } from '../BookingForm';
import { CreditCard, Shield, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAirbnbBookingSubmit } from '@/hooks/useAirbnbBookingSubmit';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface PaymentStepProps {
  data: BookingData;
  onBack: () => void;
}

const PaymentStep: React.FC<PaymentStepProps> = ({ data, onBack }) => {
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  const { submitBooking, loading: isSubmitting } = useAirbnbBookingSubmit();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteBooking = async () => {
    // If logged in, skip payment collection
    if (isAuthenticated) {
      const bookingSubmission = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || '',
        houseNumber: data.address?.split(' ')[0] || '',
        street: data.address?.split(' ').slice(1).join(' ') || '',
        postcode: data.postcode || '',
        city: '', 
        propertyAccess: '',
        accessNotes: data.specialRequests || '',
        propertyType: data.propertyType,
        bedrooms: data.bedrooms.toString(),
        bathrooms: data.bathrooms.toString(),
        serviceType: 'airbnb',
        selectedDate: data.selectedDate || null,
        selectedTime: data.selectedTime || '09:00',
        totalCost: data.totalCost,
        estimatedHours: data.estimatedHours + data.extraHours,
        hourlyRate: 25,
        notes: data.specialRequests || '',
        additionalDetails: {
          linenProvision: data.linenProvision,
          changeFrequency: data.changeFrequency
        }
      };

      const result = await submitBooking(bookingSubmission);
      
      if (result.success) {
        toast({
          title: 'Booking Complete!',
          description: `Your booking has been created. Reference: #${result.bookingId}. Payment will be processed by our team.`,
        });
      }
      return;
    }

    // Guest booking - collect payment details
    if (!stripe || !elements) {
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description: 'Payment system not ready. Please try again.',
      });
      return;
    }

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) return;

      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
        },
      });

      if (pmError) {
        throw new Error(pmError.message);
      }

      // Collect payment method via edge function
      const { data: pmData, error: collectError } = await supabase.functions.invoke('stripe-collect-payment-method', {
        body: {
          customerEmail: data.email,
          customerName: `${data.firstName} ${data.lastName}`,
          paymentMethodId: paymentMethod.id,
          isDefault: true
        }
      });

      if (collectError) throw collectError;

      // Submit booking
      const bookingSubmission = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || '',
        houseNumber: data.address?.split(' ')[0] || '',
        street: data.address?.split(' ').slice(1).join(' ') || '',
        postcode: data.postcode || '',
        city: '', 
        propertyAccess: '',
        accessNotes: data.specialRequests || '',
        propertyType: data.propertyType,
        bedrooms: data.bedrooms.toString(),
        bathrooms: data.bathrooms.toString(),
        serviceType: 'airbnb',
        selectedDate: data.selectedDate || null,
        selectedTime: data.selectedTime || '09:00',
        totalCost: data.totalCost,
        estimatedHours: data.estimatedHours + data.extraHours,
        hourlyRate: 25,
        notes: data.specialRequests || '',
        additionalDetails: {
          linenProvision: data.linenProvision,
          changeFrequency: data.changeFrequency
        }
      };

      const result = await submitBooking(bookingSubmission);
      
      if (result.success) {
        toast({
          title: 'Booking Complete!',
          description: `Your booking has been confirmed. Reference: #${result.bookingId}`,
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: error.message || 'Failed to process payment.',
      });
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

      {/* Payment Method Section */}
      {!loading && (
        <div className="space-y-4">
          {isAuthenticated ? (
            <div className="border rounded-lg p-6 bg-accent">
              <h3 className="font-medium mb-2">Payment Details</h3>
              <p className="text-sm text-muted-foreground">
                As a registered customer, you can complete this booking without payment now. 
                Our team will process the payment from your saved payment methods.
              </p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg p-6 space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Shield className="h-5 w-5 text-success" />
                  Secure Payment Details
                </h3>
                <p className="text-sm text-muted-foreground">
                  Enter your card details to complete the booking. Your payment will be authorized now and charged after service completion.
                </p>
                <div className="border rounded-lg p-4 bg-background">
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
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-success" />
                <span>Your payment is secured with Stripe encryption</span>
              </div>
            </>
          )}
        </div>
      )}

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
        <Button variant="outline" size="lg" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button
          variant="continue"
          size="lg"
          className="px-12"
          onClick={handleCompleteBooking}
          disabled={isSubmitting || loading || (!isAuthenticated && !stripe)}
        >
          {isSubmitting ? 'Processing...' : 'Complete Booking'}
        </Button>
      </div>
    </div>
  );
};

export { PaymentStep };