import React from 'react';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentMethodStatusIconProps {
  paymentMethodCount: number;
  hasStripeAccount: boolean;
  onClick: () => void;
}

const PaymentMethodStatusIcon = ({ paymentMethodCount, hasStripeAccount, onClick }: PaymentMethodStatusIconProps) => {
  const hasPaymentMethods = paymentMethodCount > 0 || hasStripeAccount;
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn(
        "w-10 h-10 p-0 rounded-full border-2",
        hasPaymentMethods 
          ? "border-green-500 bg-green-50 hover:bg-green-100 text-green-600" 
          : "border-red-500 bg-red-50 hover:bg-red-100 text-red-600"
      )}
      title={hasPaymentMethods ? `${paymentMethodCount} payment method(s)` : "No payment methods"}
    >
      <DollarSign className="h-4 w-4" />
    </Button>
  );
};

export default PaymentMethodStatusIcon;