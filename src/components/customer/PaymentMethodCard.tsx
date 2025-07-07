import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Trash2, CheckCircle } from 'lucide-react';

interface PaymentMethod {
  id: string;
  card_brand: string;
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
}

interface PaymentMethodCardProps {
  method: PaymentMethod;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  method,
  onSetDefault,
  onDelete,
}) => {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium capitalize">
            {method.card_brand} •••• {method.card_last4}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          Expires {method.card_exp_month.toString().padStart(2, '0')}/{method.card_exp_year}
        </span>
        {method.is_default && (
          <div className="flex items-center gap-1 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            Default
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {!method.is_default && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSetDefault(method.id)}
          >
            Set as Default
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(method.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PaymentMethodCard;