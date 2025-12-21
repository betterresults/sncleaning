import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BookingData } from './src/components/booking/BookingForm';
import { CreditCard, Shield, Clock, Check, AlertCircle, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAirbnbBookingSubmit } from '@/hooks/useAirbnbBookingSubmit';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { StripeCardNumberElementChangeEvent, StripeCardExpiryElementChangeEvent, StripeCardCvcElementChangeEvent } from '@stripe/stripe-js';

interface PaymentStepProps {
  data: BookingData;
  onBack: () => void;
}

interface CardErrors {
  cardNumber: string | null;
  cardExpiry: string | null;
  cardCvc: string | null;
}

interface CardComplete {
  cardNumber: boolean;
  cardExpiry: boolean;
  cardCvc: boolean;
}

type PaymentType = 'card' | 'bank-transfer';

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
  const [paymentType, setPaymentType] = useState<PaymentType>('card');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  // Card validation state
  const [cardErrors, setCardErrors] = useState<CardErrors>({
    cardNumber: null,
    cardExpiry: null,
    cardCvc: null
  });
  const [cardComplete, setCardComplete] = useState<CardComplete>({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false
  });

  const isCardValid = cardComplete.cardNumber && cardComplete.cardExpiry && cardComplete.cardCvc && 
    !cardErrors.cardNumber && !cardErrors.cardExpiry && !cardErrors.cardCvc;

  // Card element change handlers
  const handleCardNumberChange = (event: StripeCardNumberElementChangeEvent) => {
    console.log('[PaymentStep] Card number change:', { complete: event.complete, error: event.error?.message });
    setCardErrors(prev => ({ ...prev, cardNumber: event.error?.message || null }));
    setCardComplete(prev => ({ ...prev, cardNumber: event.complete }));
  };

  const handleCardExpiryChange = (event: StripeCardExpiryElementChangeEvent) => {
    console.log('[PaymentStep] Card expiry change:', { complete: event.complete, error: event.error?.message });
    setCardErrors(prev => ({ ...prev, cardExpiry: event.error?.message || null }));
    setCardComplete(prev => ({ ...prev, cardExpiry: event.complete }));
  };

  const handleCardCvcChange = (event: StripeCardCvcElementChangeEvent) => {
    console.log('[PaymentStep] Card CVC change:', { complete: event.complete, error: event.error?.message });
    setCardErrors(prev => ({ ...prev, cardCvc: event.error?.message || null }));
    setCardComplete(prev => ({ ...prev, cardCvc: event.complete }));
  };

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
    // Clear any previous payment error
    setPaymentError(null);
    
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
      },
      paymentMethod: paymentType // Include selected payment type
    };

    // Handle Bank Transfer payment - skip card processing entirely
    if (paymentType === 'bank-transfer') {
      console.log('[PaymentStep] Processing bank transfer booking');
      const result = await submitBooking({
        ...bookingSubmission,
        paymentMethod: 'bank-transfer'
      });
      
      if (result.success) {
        toast({
          title: 'Booking Complete!',
          description: `Your booking has been created. Reference: #${result.bookingId}. We will send you bank transfer details shortly.`,
        });
      }
      return;
    }

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

    // Card payment - need to collect/charge payment
    if (!stripe || !elements) {
      setPaymentError('Payment system is not ready. Please refresh the page and try again.');
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description: 'Payment system not ready. Please try again.',
      });
      return;
    }

    try {
      let paymentMethodId = selectedPaymentMethod;

      // If no saved payment method, create new one using SetupIntent (supports 3DS)
      if (!paymentMethodId) {
        console.log('[PaymentStep] No saved payment method, creating new one with 3DS support');
        console.log('[PaymentStep] Card validation state:', { cardComplete, cardErrors, isCardValid });
        
        const cardElement = elements.getElement(CardNumberElement);
        if (!cardElement) {
          console.error('[PaymentStep] CardNumberElement not found in DOM');
          toast({
            variant: 'destructive',
            title: 'Payment Required',
            description: 'Please enter card details to complete booking.',
          });
          return;
        }

        // Validate card is complete before attempting
        if (!isCardValid) {
          console.error('[PaymentStep] Card validation failed:', { cardComplete, cardErrors });
          const errorMessages: string[] = [];
          if (!cardComplete.cardNumber) errorMessages.push('card number is incomplete');
          if (!cardComplete.cardExpiry) errorMessages.push('expiry date is incomplete');
          if (!cardComplete.cardCvc) errorMessages.push('CVC is incomplete');
          if (cardErrors.cardNumber) errorMessages.push(cardErrors.cardNumber);
          if (cardErrors.cardExpiry) errorMessages.push(cardErrors.cardExpiry);
          if (cardErrors.cardCvc) errorMessages.push(cardErrors.cardCvc);
          
          toast({
            variant: 'destructive',
            title: 'Card Details Invalid',
            description: `Please fix: ${errorMessages.join(', ')}.`,
          });
          return;
        }

        // Step 1: Get or create customer, then create SetupIntent
        console.log('[PaymentStep] Creating customer and SetupIntent...');
        
        // First, we need to get/create the customer
        const { data: customerResult, error: customerError } = await supabase
          .from('customers')
          .select('id')
          .eq('email', data.email)
          .single();
        
        let internalCustomerId = customerResult?.id;
        
        if (!internalCustomerId) {
          // Create customer first via the booking submission which handles this
          console.log('[PaymentStep] Customer not found, will be created during booking');
        }
        
        // Create a SetupIntent - this is required for 3DS authentication
        const { data: setupIntentData, error: setupIntentError } = await supabase.functions.invoke('stripe-create-setup-intent', {
          body: {
            customer_id: internalCustomerId || 0, // Will handle guest case
            email: data.email,
            name: `${data.firstName} ${data.lastName}`
          }
        });

        if (setupIntentError || !setupIntentData?.clientSecret) {
          console.error('[PaymentStep] Failed to create SetupIntent:', setupIntentError || 'No client secret returned');
          throw new Error('Failed to initialize payment. Please try again.');
        }

        console.log('[PaymentStep] SetupIntent created, confirming card setup with 3DS support...');
        
        // Step 2: Confirm the SetupIntent with the card - THIS HANDLES 3DS!
        const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(
          setupIntentData.clientSecret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: `${data.firstName} ${data.lastName}`,
                email: data.email,
              },
            },
          }
        );

        if (confirmError) {
          console.error('[PaymentStep] stripe.confirmCardSetup failed:', {
            code: confirmError.code,
            type: confirmError.type,
            message: confirmError.message,
            decline_code: (confirmError as any).decline_code
          });
          
          // Provide user-friendly error messages
          let userMessage = confirmError.message || 'Card setup failed';
          if (confirmError.code === 'card_declined') {
            userMessage = 'Your card was declined. Please try a different card.';
          } else if (confirmError.code === 'expired_card') {
            userMessage = 'Your card has expired. Please use a valid card.';
          } else if (confirmError.code === 'incorrect_cvc') {
            userMessage = 'The CVC code is incorrect. Please check and try again.';
          } else if (confirmError.code === 'insufficient_funds') {
            userMessage = 'Insufficient funds. Please try a different card.';
          } else if (confirmError.code === 'processing_error') {
            userMessage = 'An error occurred processing your card. Please try again.';
          } else if (confirmError.code === 'authentication_required') {
            userMessage = 'Card authentication was cancelled or failed. Please try again.';
          } else if (confirmError.code === 'setup_intent_authentication_failure') {
            userMessage = 'Card authentication failed. Please try again or use a different card.';
          }
          
          throw new Error(userMessage);
        }

        if (!setupIntent?.payment_method) {
          console.error('[PaymentStep] SetupIntent confirmed but no payment method returned');
          throw new Error('Payment setup completed but card was not saved. Please try again.');
        }

        console.log('[PaymentStep] Card setup confirmed successfully:', setupIntent.payment_method);
        paymentMethodId = typeof setupIntent.payment_method === 'string' 
          ? setupIntent.payment_method 
          : setupIntent.payment_method.id;

        // Step 3: Save the payment method to our database
        console.log('[PaymentStep] Saving payment method to database...');
        const { data: saveResult, error: saveError } = await supabase.functions.invoke('stripe-save-payment-method', {
          body: {
            customer_id: internalCustomerId || customerId,
            payment_method_id: paymentMethodId,
            stripe_customer_id: setupIntentData.stripeCustomerId
          }
        });

        if (saveError) {
          console.error('[PaymentStep] Failed to save payment method:', saveError);
          // Don't throw here - the payment method is still valid, just not saved
          console.warn('[PaymentStep] Continuing without saving payment method to database');
        } else {
          console.log('[PaymentStep] Payment method saved successfully');
        }
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
      console.error('[PaymentStep] Payment error:', error);
      const errorMessage = error.message || 'Failed to process payment. Please try again or use bank transfer.';
      setPaymentError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: errorMessage,
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
        <div className="space-y-6">
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

          {/* Payment Error Display */}
          {paymentError && (
            <div className="border-l-4 border-destructive bg-destructive/10 p-4 rounded">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-destructive">Payment Error</h3>
                  <p className="text-sm text-destructive/90 mt-1">{paymentError}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    You can try again with a different card, or choose Bank Transfer below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Type Selector */}
          <div className="space-y-3">
            <h3 className="font-medium">How would you like to pay?</h3>
            <div className="grid grid-cols-2 gap-3">
              {/* Card Payment Option */}
              <div
                onClick={() => { setPaymentType('card'); setPaymentError(null); }}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  paymentType === 'card'
                    ? 'border-primary bg-accent ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-primary" />
                  <div>
                    <div className="font-medium">Card Payment</div>
                    <div className="text-xs text-muted-foreground">Pay securely with your card</div>
                  </div>
                </div>
                {paymentType === 'card' && (
                  <Check className="h-5 w-5 text-primary absolute top-2 right-2" />
                )}
              </div>

              {/* Bank Transfer Option */}
              <div
                onClick={() => { setPaymentType('bank-transfer'); setPaymentError(null); }}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  paymentType === 'bank-transfer'
                    ? 'border-primary bg-accent ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-primary" />
                  <div>
                    <div className="font-medium">Bank Transfer</div>
                    <div className="text-xs text-muted-foreground">Pay via bank transfer</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Transfer Info */}
          {paymentType === 'bank-transfer' && (
            <div className="border rounded-lg p-6 bg-accent/50 space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Bank Transfer Payment
              </h3>
              <p className="text-sm text-muted-foreground">
                Complete your booking now and we'll send you our bank details by email. 
                Please transfer the payment within 24 hours to confirm your booking.
              </p>
              <div className="text-sm">
                <span className="font-medium">Total to transfer: </span>
                <span className="text-primary font-bold">£{data.totalCost.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Show saved payment methods for logged in users - only if card payment selected */}
          {paymentType === 'card' && isAuthenticated && paymentMethods.length > 0 && requiresImmediatePayment && (
            <div className="space-y-3">
              <h3 className="font-medium">Select Saved Card</h3>
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

          {/* Card entry form - only show if card payment selected */}
          {paymentType === 'card' && ((!isAuthenticated || requiresImmediatePayment) && (!paymentMethods.length || !isAuthenticated)) && (
            <div className="border rounded-lg p-6 space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Shield className="h-5 w-5 text-success" />
                {requiresImmediatePayment ? 'Enter Card Details' : 'Secure Payment Details'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {requiresImmediatePayment 
                  ? 'Your card will be charged immediately to confirm your booking.'
                  : 'Enter your card details. Payment will be authorized now and charged after service completion.'}
              </p>
              <div className="border rounded-lg p-4 bg-background space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Card Number</label>
                  <div className={`p-3 border rounded-lg bg-background transition-colors ${
                    cardErrors.cardNumber ? 'border-destructive' : 'border-border'
                  }`}>
                    <CardNumberElement
                      onChange={handleCardNumberChange}
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: 'hsl(var(--foreground))',
                            '::placeholder': {
                              color: 'hsl(var(--muted-foreground))',
                            },
                          },
                          invalid: {
                            color: 'hsl(var(--destructive))',
                          },
                        },
                      }}
                    />
                  </div>
                  {cardErrors.cardNumber && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      <span>{cardErrors.cardNumber}</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-2">Expiry Date</label>
                    <div className={`p-3 border rounded-lg bg-background transition-colors ${
                      cardErrors.cardExpiry ? 'border-destructive' : 'border-border'
                    }`}>
                      <CardExpiryElement
                        onChange={handleCardExpiryChange}
                        options={{
                          style: {
                            base: {
                              fontSize: '16px',
                              color: 'hsl(var(--foreground))',
                              '::placeholder': {
                                color: 'hsl(var(--muted-foreground))',
                              },
                            },
                            invalid: {
                              color: 'hsl(var(--destructive))',
                            },
                          },
                        }}
                      />
                    </div>
                    {cardErrors.cardExpiry && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        <span>{cardErrors.cardExpiry}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-2">CVC</label>
                    <div className={`p-3 border rounded-lg bg-background transition-colors ${
                      cardErrors.cardCvc ? 'border-destructive' : 'border-border'
                    }`}>
                      <CardCvcElement
                        onChange={handleCardCvcChange}
                        options={{
                          style: {
                            base: {
                              fontSize: '16px',
                              color: 'hsl(var(--foreground))',
                              '::placeholder': {
                                color: 'hsl(var(--muted-foreground))',
                              },
                            },
                            invalid: {
                              color: 'hsl(var(--destructive))',
                            },
                          },
                        }}
                      />
                    </div>
                    {cardErrors.cardCvc && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        <span>{cardErrors.cardCvc}</span>
                      </div>
                    )}
                  </div>
                </div>
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
          disabled={
            isSubmitting || 
            loading || 
            (paymentType === 'card' && requiresImmediatePayment && !selectedPaymentMethod && !isCardValid && !stripe)
          }
        >
          {isSubmitting 
            ? 'Processing...' 
            : paymentType === 'bank-transfer'
              ? 'Complete Booking (Bank Transfer)'
              : requiresImmediatePayment 
                ? 'Pay Now & Complete Booking' 
                : 'Complete Booking'
          }
        </Button>
      </div>
    </div>
  );
};

export { PaymentStep };