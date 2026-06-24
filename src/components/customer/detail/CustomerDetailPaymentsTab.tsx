import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  X,
  CreditCard,
  Calendar,
  AlertTriangle,
  Banknote,
  Keyboard,
} from 'lucide-react';
import type { CustomerDetailPaymentsTabProps } from './types';

export function CustomerDetailPaymentsTab({
  paymentMethods,
  unpaidBookings,
  totalUnpaid,
  onAddCard,
  onChargeNow,
  onDeletePaymentMethod,
  onSetDefaultPaymentMethod,
}: CustomerDetailPaymentsTabProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods ({paymentMethods.length})
            </CardTitle>
            <Button onClick={onAddCard} size="sm" className="bg-[#18A5A5] hover:bg-[#185166]">
              <Keyboard className="h-4 w-4 mr-2" />
              Add Card
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {paymentMethods.length > 0 ? (
            <div className="space-y-2">
              {paymentMethods.map((pm) => {
                const isExpired =
                  pm.card_exp_year < currentYear ||
                  (pm.card_exp_year === currentYear && pm.card_exp_month < currentMonth);

                return (
                  <div
                    key={pm.id}
                    className={`flex items-center justify-between p-3 border rounded-lg ${isExpired ? 'bg-red-50 border-red-200' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard
                        className={`h-5 w-5 ${isExpired ? 'text-red-500' : 'text-muted-foreground'}`}
                      />
                      <div>
                        <span className={`font-medium ${isExpired ? 'text-red-700' : ''}`}>
                          {pm.card_brand.toUpperCase()} •••• {pm.card_last4}
                        </span>
                        <div
                          className={`text-sm ${isExpired ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}
                        >
                          {isExpired ? 'EXPIRED' : 'Expires'} {pm.card_exp_month}/{pm.card_exp_year}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {pm.is_default ? (
                        <Badge variant="default" className="bg-green-600">
                          Default
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSetDefaultPaymentMethod(pm.id)}
                          disabled={isExpired}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeletePaymentMethod(pm.id)}
                        className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="mb-4">No payment methods on file</p>
              <Button onClick={onAddCard} className="bg-[#18A5A5] hover:bg-[#185166]">
                <Keyboard className="h-4 w-4 mr-2" />
                Add Card Manually
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {unpaidBookings.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                Outstanding Payments ({unpaidBookings.length})
              </CardTitle>
              {paymentMethods.length > 0 && (
                <Button onClick={onChargeNow} className="bg-[#18A5A5] hover:bg-[#185166]">
                  <Banknote className="h-4 w-4 mr-2" />
                  Charge £{totalUnpaid.toFixed(2)} Now
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {unpaidBookings.map((booking) => (
                <div key={`${booking.source}-${booking.id}`} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {new Date(booking.date_time).toLocaleDateString()}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {booking.source === 'past_booking' ? 'Cleaning' : 'Linen'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {booking.cleaning_type} - {booking.address}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Status: {booking.payment_status}
                      </p>
                    </div>
                    <div className="font-semibold text-red-800">
                      £{booking.total_cost.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
