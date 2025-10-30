import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BookingData } from '../BookingForm';
import { CreditCard, Shield, Clock, Plus, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAirbnbBookingSubmit } from '@/hooks/useAirbnbBookingSubmit';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface PaymentStepProps {
  data: BookingData;
  onBack: () => void;
}

interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

const PaymentStep: React.FC<PaymentStepProps> = ({ data, onBack }) => {
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  const { submitBooking, isSubmitting } = useAirbnbBookingSubmit();
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState<number | null>(null);

  useEffect(() => {
    loadCustomerPaymentMethods();
  }, [data.email]);

  const loadCustomerPaymentMethods = async () => {
    if (!data.email) return;

    try {
      // Get or create customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('email', data.email)
        .single();

      if (customerError || !customer) {
        setLoading(false);
        setShowNewCardForm(true);
        return;
      }

      setCustomerId(customer.id);

      // Load payment methods
      const { data: methods, error: methodsError } = await supabase
        .from('customer_payment_methods')
        .select('*')
        .eq('customer_id', customer.id);

      if (methodsError) throw methodsError;

      if (methods && methods.length > 0) {
        setPaymentMethods(methods as PaymentMethod[]);
        const defaultMethod = methods.find(m => m.is_default);
        setSelectedPaymentMethod(defaultMethod?.stripe_payment_method_id || methods[0].stripe_payment_method_id);
      } else {
        setShowNewCardForm(true);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewCard = async () => {
    if (!stripe || !elements) return;

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) return;

      // Collect payment method
      const { data: pmData, error: pmError } = await supabase.functions.invoke('stripe-collect-payment-method', {
        body: {
          customerEmail: data.email,
          customerName: `${data.firstName} ${data.lastName}`,
          isDefault: paymentMethods.length === 0
        }
      });

      if (pmError) throw pmError;

      toast({
        title: 'Payment Method Added',
        description: 'Your card has been saved successfully.',
      });

      await loadCustomerPaymentMethods();
      setShowNewCardForm(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Add Card',
        description: error.message,
      });
    }
  };

  const handleCompleteBooking = async () => {
    if (!paymentMethods.length && !showNewCardForm) {
      toast({
        variant: 'destructive',
        title: 'Payment Method Required',
        description: 'Please add a payment method to complete your booking.',
      });
      return;
    }

    // Convert BookingData to BookingSubmission format
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
      // Redirect or show success message
      toast({
        title: 'Booking Complete!',
        description: `Your booking has been confirmed. Reference: #${result.bookingId}`,
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

      {/* Payment Method Selection */}
      {!loading && (
        <div className="space-y-4">
          {paymentMethods.length > 0 && !showNewCardForm && (
            <div className="space-y-3">
              <h3 className="font-medium">Select Payment Method</h3>
              {paymentMethods.map((method) => (
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
                          {method.brand.toUpperCase()} •••• {method.last4}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Expires {method.exp_month}/{method.exp_year}
                        </div>
                      </div>
                    </div>
                    {selectedPaymentMethod === method.stripe_payment_method_id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => setShowNewCardForm(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Card
              </Button>
            </div>
          )}

          {showNewCardForm && (
            <div className="border rounded-lg p-6 space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Shield className="h-5 w-5 text-success" />
                Add New Payment Method
              </h3>
              <div className="border rounded-lg p-4">
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
              <div className="flex gap-2">
                <Button onClick={handleAddNewCard} disabled={!stripe}>
                  Save Card
                </Button>
                {paymentMethods.length > 0 && (
                  <Button variant="outline" onClick={() => setShowNewCardForm(false)}>
                    Cancel
                  </Button>
                )}
              </div>
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
          variant="continue"
          size="lg"
          className="px-12"
          onClick={handleCompleteBooking}
          disabled={isSubmitting || loading || (!paymentMethods.length && !showNewCardForm)}
        >
          {isSubmitting ? 'Processing...' : 'Complete Booking'}
        </Button>
      </div>
    </div>
  );
};

export { PaymentStep };