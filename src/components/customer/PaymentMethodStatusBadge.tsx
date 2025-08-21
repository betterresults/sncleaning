import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CreditCard, CheckCircle, XCircle } from 'lucide-react';

interface PaymentMethodStatusBadgeProps {
  paymentMethodCount: number;
  hasStripeAccount: boolean;
}

const PaymentMethodStatusBadge = ({ paymentMethodCount, hasStripeAccount }: PaymentMethodStatusBadgeProps) => {
  if (paymentMethodCount === 0 && !hasStripeAccount) {
    return (
      <div className="flex items-center gap-1">
        <Badge variant="outline" className="gap-1 text-muted-foreground">
          <XCircle className="h-3 w-3" />
          No Payment Methods
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {paymentMethodCount > 0 && (
        <Badge variant="secondary" className="gap-1">
          <CreditCard className="h-3 w-3" />
          {paymentMethodCount} Card{paymentMethodCount > 1 ? 's' : ''}
        </Badge>
      )}
      {hasStripeAccount && (
        <Badge variant="default" className="gap-1 bg-green-600">
          <CheckCircle className="h-3 w-3" />
          Stripe Connected
        </Badge>
      )}
    </div>
  );
};

export default PaymentMethodStatusBadge;