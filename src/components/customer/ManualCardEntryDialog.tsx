import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ManualCardEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number;
  onSuccess: () => void;
}

const ManualCardEntryDialog: React.FC<ManualCardEntryDialogProps> = ({
  open,
  onOpenChange,
  customerId,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvc, setCvc] = useState('');

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardNumber(formatted);
    }
  };

  const handleExpMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 2) {
      const num = parseInt(value);
      if (value === '' || (num >= 0 && num <= 12)) {
        setExpMonth(value);
      }
    }
  };

  const handleExpYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setExpYear(value);
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setCvc(value);
    }
  };

  const resetForm = () => {
    setCardNumber('');
    setExpMonth('');
    setExpYear('');
    setCvc('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cardNumber || !expMonth || !expYear || !cvc) {
      toast({
        title: "Error",
        description: "Please fill in all card details",
        variant: "destructive",
      });
      return;
    }

    // Validate card number length
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      toast({
        title: "Error",
        description: "Invalid card number",
        variant: "destructive",
      });
      return;
    }

    // Validate expiry
    const month = parseInt(expMonth);
    const year = parseInt(expYear);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    if (month < 1 || month > 12) {
      toast({
        title: "Error",
        description: "Invalid expiry month",
        variant: "destructive",
      });
      return;
    }

    // Handle 2-digit year
    let fullYear = year;
    if (year < 100) {
      fullYear = 2000 + year;
    }

    if (fullYear < currentYear || (fullYear === currentYear && month < currentMonth)) {
      toast({
        title: "Error",
        description: "Card has expired",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('stripe-add-card-manual', {
        body: {
          customer_id: customerId,
          card_number: cleanCardNumber,
          exp_month: month.toString(),
          exp_year: fullYear.toString(),
          cvc: cvc,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to add card');
      }

      toast({
        title: "Success",
        description: `Card ending in ${data.payment_method.card_last4} added successfully`,
      });

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error adding card:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add card. Please check the details and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Add Card Manually
          </DialogTitle>
          <DialogDescription>
            Enter the customer's card details to add a payment method.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              type="text"
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={handleCardNumberChange}
              className="font-mono"
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="expMonth">Month</Label>
              <Input
                id="expMonth"
                type="text"
                placeholder="MM"
                value={expMonth}
                onChange={handleExpMonthChange}
                className="font-mono text-center"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expYear">Year</Label>
              <Input
                id="expYear"
                type="text"
                placeholder="YYYY"
                value={expYear}
                onChange={handleExpYearChange}
                className="font-mono text-center"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                type="text"
                placeholder="123"
                value={cvc}
                onChange={handleCvcChange}
                className="font-mono text-center"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <Lock className="h-3 w-3" />
            <span>Card details are securely processed via Stripe</span>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#18A5A5] hover:bg-[#185166]"
            >
              {loading ? 'Adding...' : 'Add Card'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ManualCardEntryDialog;
