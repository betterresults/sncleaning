import React from 'react';
import { Button } from '@/components/ui/button';
import { BookingData } from '../BookingForm';
import { CreditCard, Shield, Clock } from 'lucide-react';

interface PaymentStepProps {
  data: BookingData;
  onBack: () => void;
}

const PaymentStep: React.FC<PaymentStepProps> = ({ data, onBack }) => {
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

      {/* Payment Integration Placeholder */}
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
        <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Payment Integration
        </h3>
        <p className="text-muted-foreground mb-6">
          Payment processing will be implemented soon. This section will include secure payment options 
          including credit cards, PayPal, and other payment methods.
        </p>
        
        <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-success" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4 text-success" />
            <span>Multiple Methods</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 text-success" />
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
        <Button variant="outline" size="lg" onClick={onBack}>
          Back
        </Button>
        <Button
          variant="default"
          size="lg"
          className="px-12"
          onClick={() => alert('Payment processing will be implemented soon!')}
        >
          Complete Booking
        </Button>
      </div>
    </div>
  );
};

export { PaymentStep };