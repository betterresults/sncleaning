import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BookingData } from './src/components/booking/BookingForm';
import { CreditCard, Shield, Clock, Check } from 'lucide-react';
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
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [requiresImmediatePayment, setRequiresImmediatePayment] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    checkBookingUrgency();
  }, [data.selectedDate]);

  const checkBookingUrgency = () => {
    if (!data.selectedDate) return;
    
    const bookingDate = new Date(data.selectedDate);
    const now = new Date();
    const hoursDifference = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Require immediate payment if booking is within 48 hours
    setRequiresImmediatePayment(hoursDifference <= 48);
  };

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      
      if (session) {
        await loadCustomerPaymentMethods();
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerPaymentMethods = async () => {
    if (!data.email) return;

    try {
      // Get customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('email', data.email)
        .single();

      if (customerError || !customer) return;

      setCustomerId(customer.id);

      // Load payment methods
      const { data: methods, error: methodsError } = await supabase
        .from('customer_payment_methods')
        .select('*')
        .eq('customer_id', customer.id);

      if (methodsError) return;

      if (methods && methods.length > 0) {
        setPaymentMethods(methods);
        const defaultMethod = methods.find(m => m.is_default);
        setSelectedPaymentMethod(defaultMethod?.stripe_payment_method_id || methods[0].stripe_payment_method_id);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const handleCompleteBooking = async () => {
    const bookingSubmission = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || '',
      houseNumber: data.houseNumber || '',
      street: data.street || '',
      postcode: data.postcode || '',
      city: data.city || '', 
      propertyAccess: data.propertyAccess || '',
      accessNotes: data.accessNotes || '',
      propertyType: data.propertyType,
      bedrooms: data.bedrooms.toString(),
      bathrooms: data.bathrooms.toString(),
      serviceType: data.serviceType || 'airbnb',
      selectedDate: data.selectedDate || null,
      selectedTime: data.selectedTime || '09:00',
      totalCost: data.totalCost,
      estimatedHours: (data.estimatedHours || 0) + data.extraHours,
      hourlyRate: data.hourlyRate,
      notes: data.notes || '',
      additionalDetails: {
        linensHandling: data.linensHandling,
        needsIroning: data.needsIroning,
        ironingHours: data.ironingHours
      }
    };

    // If booking is NOT within 48 hours and user is logged in, skip payment
    if (!requiresImmediatePayment && isAuthenticated) {
      const result = await submitBooking(bookingSubmission);
      
      if (result.success) {
        toast({
          title: 'Booking Complete!',
          description: `Your booking has been created. Reference: #${result.bookingId}. Payment will be processed by our team.`,
        });
      }
      return;
    }

    // Booking within 48 hours OR guest - need to collect/charge payment
    if (!stripe || !elements) {
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description: 'Payment system not ready. Please try again.',
      });
      return;
    }

    try {
      let paymentMethodId = selectedPaymentMethod;

      // If no saved payment method, create new one
      if (!paymentMethodId) {
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          toast({
            variant: 'destructive',
            title: 'Payment Required',
            description: 'Please enter card details to complete booking.',
          });
          return;
        }

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

        // Save payment method
        const { data: pmData, error: collectError } = await supabase.functions.invoke('stripe-collect-payment-method', {
          body: {
            customerEmail: data.email,
            customerName: `${data.firstName} ${data.lastName}`,
            paymentMethodId: paymentMethod.id,
            isDefault: true
          }
        });

        if (collectError) throw collectError;
        paymentMethodId = paymentMethod.id;
      }

      // Submit booking first (skip payment auth for urgent bookings)
      const result = await submitBooking(bookingSubmission, requiresImmediatePayment);
      
      if (!result.success || !result.bookingId) {
        throw new Error('Failed to create booking');
      }

      // Charge payment immediately for bookings within 48 hours
      if (requiresImmediatePayment) {
        const customerIdToUse = result.customerId || customerId;
        
        if (!customerIdToUse || !paymentMethodId) {
          throw new Error('Customer ID or payment method missing');
        }

        const { data: paymentResult, error: paymentError } = await supabase.functions.invoke('stripe-capture-payment', {
          body: {
            customer_id: customerIdToUse,
            payment_method_id: paymentMethodId,
            amount: Math.round(data.totalCost * 100), // Convert to cents
            description: `Airbnb cleaning booking #${result.bookingId}`,
            booking_ids: [result.bookingId]
          }
        });

        if (paymentError) {
          toast({
            variant: 'destructive',
            title: 'Payment Failed',
            description: 'Booking created but payment failed. We will contact you.',
          });
          return;
        }
      }

      toast({
        title: 'Booking Complete!',
        description: requiresImmediatePayment 
          ? `Your booking has been confirmed and paid. Reference: #${result.bookingId}`
          : `Your booking has been confirmed. Reference: #${result.bookingId}`,
      });
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
          {/* Urgent booking notice */}
          {requiresImmediatePayment && (
            <div className="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950 p-4 rounded">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <h3 className="font-medium text-orange-900 dark:text-orange-100">Immediate Payment Required</h3>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    Your booking is within 48 hours. Payment will be charged immediately to confirm your reservation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Show saved payment methods for logged in users */}
          {isAuthenticated && paymentMethods.length > 0 && requiresImmediatePayment && (
            <div className="space-y-3">
              <h3 className="font-medium">Select Payment Method</h3>
              {paymentMethods.map((method: any) => (
                <div
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.stripe_payment_method_id)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPaymentMethod === method.stripe_payment_method_id
                      ? 'border-primary bg-accent'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5" />
                      <div>
                        <div className="font-medium">
                          {method.card_brand?.toUpperCase()} •••• {method.card_last4}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Expires {method.card_exp_month}/{method.card_exp_year}
                        </div>
                      </div>
                    </div>
                    {selectedPaymentMethod === method.stripe_payment_method_id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Card entry form for guests or when immediate payment required without saved methods */}
          {((!isAuthenticated || requiresImmediatePayment) && (!paymentMethods.length || !isAuthenticated)) && (
            <div className="border rounded-lg p-6 space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Shield className="h-5 w-5 text-success" />
                {requiresImmediatePayment ? 'Payment Required Now' : 'Secure Payment Details'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {requiresImmediatePayment 
                  ? 'Your card will be charged immediately to confirm your booking.'
                  : 'Enter your card details. Payment will be authorized now and charged after service completion.'}
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
          )}

          {/* No payment required notice for future bookings with auth */}
          {!requiresImmediatePayment && isAuthenticated && (
            <div className="border rounded-lg p-6 bg-accent">
              <h3 className="font-medium mb-2">Payment Details</h3>
              <p className="text-sm text-muted-foreground">
                Your booking is scheduled for more than 48 hours from now. Payment will be processed automatically 24 hours before your booking using your saved payment method.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
            <Shield className="h-4 w-4 text-success" />
            <span>Your payment is secured with Stripe encryption</span>
          </div>
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
          variant="default"
          size="lg"
          className="px-12"
          onClick={handleCompleteBooking}
          disabled={isSubmitting || loading || (requiresImmediatePayment && !selectedPaymentMethod && !stripe)}
        >
          {isSubmitting ? 'Processing...' : requiresImmediatePayment ? 'Pay Now & Complete Booking' : 'Complete Booking'}
        </Button>
      </div>
    </div>
  );
};

export { PaymentStep };