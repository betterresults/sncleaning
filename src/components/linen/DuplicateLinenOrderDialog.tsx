import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LinenOrder {
  id: string;
  customer_id: number;
  address_id: string;
  order_date: string;
  delivery_date?: string;
  pickup_date?: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total_cost: number;
  admin_cost: number;
  notes?: string;
  customers?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  addresses?: {
    address: string;
    postcode: string;
  };
}

interface DuplicateLinenOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: LinenOrder | null;
  onSuccess: () => void;
}

export const DuplicateLinenOrderDialog: React.FC<DuplicateLinenOrderDialogProps> = ({
  open,
  onOpenChange,
  order,
  onSuccess,
}) => {
  const [orderDate, setOrderDate] = useState<Date>();
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDuplicate = async () => {
    if (!order || !orderDate) {
      toast({ 
        title: "Please select an order date", 
        variant: "destructive" 
      });
      return;
    }

    setIsLoading(true);

    try {
      // First, get the order items from the original order
      const { data: orderItems, error: itemsError } = await supabase
        .from('linen_order_items')
        .select('product_id, quantity, unit_price')
        .eq('order_id', order.id);

      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
        throw itemsError;
      }

      // Create the duplicate order data
      const duplicateOrderData = {
        customer_id: order.customer_id,
        address_id: order.address_id,
        order_date: format(orderDate, 'yyyy-MM-dd'),
        delivery_date: deliveryDate ? format(deliveryDate, 'yyyy-MM-dd') : null,
        status: 'scheduled', // Reset status for new order
        payment_status: 'unpaid', // Reset payment status
        payment_method: order.payment_method,
        admin_cost: order.admin_cost,
        notes: order.notes,
      };

      console.log('Creating duplicate order with data:', duplicateOrderData);

      // Insert the new order
      const { data: newOrder, error: orderError } = await supabase
        .from('linen_orders')
        .insert([duplicateOrderData])
        .select()
        .single();

      if (orderError) {
        console.error('Error creating duplicate order:', orderError);
        throw orderError;
      }

      // Insert the order items if any exist
      if (orderItems && orderItems.length > 0) {
        const duplicateItems = orderItems.map(item => ({
          order_id: newOrder.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }));

        const { error: itemsInsertError } = await supabase
          .from('linen_order_items')
          .insert(duplicateItems);

        if (itemsInsertError) {
          console.error('Error creating duplicate order items:', itemsInsertError);
          throw itemsInsertError;
        }
      }

      console.log('Order duplicated successfully');
      toast({ 
        title: "✅ Order Duplicated", 
        description: "The order has been successfully duplicated",
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setOrderDate(undefined);
      setDeliveryDate(undefined);
    } catch (error) {
      console.error('Error duplicating order:', error);
      toast({ 
        title: "Error duplicating order", 
        description: "Please try again", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = orderDate !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-slate-50 to-blue-50 border-0 shadow-2xl">
        <DialogHeader className="pb-6 border-b border-gray-200">
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <Copy className="h-5 w-5 text-blue-600" />
            Duplicate Linen Order
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {order && (
            <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Original Order
              </h4>
              <p className="text-gray-700 font-medium">
                {order.customers?.first_name} {order.customers?.last_name}
              </p>
              <p className="text-gray-500 text-sm">
                Order Date: {format(new Date(order.order_date), 'EEEE, MMMM do, yyyy')}
              </p>
              {order.delivery_date && (
                <p className="text-gray-500 text-sm">
                  Delivery: {format(new Date(order.delivery_date), 'EEEE, MMMM do, yyyy')}
                </p>
              )}
              <p className="text-gray-500 text-sm">
                Address: {order.addresses?.address}, {order.addresses?.postcode}
              </p>
            </div>
          )}

          {/* Order Date Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">New Order Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 justify-start text-left font-normal border-2 border-gray-200 hover:border-blue-400 rounded-xl bg-white shadow-sm transition-all duration-200",
                    !orderDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-3 h-5 w-5 text-blue-600" />
                  {orderDate ? format(orderDate, "EEEE, MMMM do, yyyy") : <span>Pick order date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border-2 border-gray-200 rounded-xl shadow-lg" align="start">
                <Calendar
                  mode="single"
                  selected={orderDate}
                  onSelect={setOrderDate}
                  initialFocus
                  className="p-4 pointer-events-auto rounded-xl"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Delivery Date Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">New Delivery Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 justify-start text-left font-normal border-2 border-gray-200 hover:border-blue-400 rounded-xl bg-white shadow-sm transition-all duration-200",
                    !deliveryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-3 h-5 w-5 text-blue-600" />
                  {deliveryDate ? format(deliveryDate, "EEEE, MMMM do, yyyy") : <span>Pick delivery date (optional)</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border-2 border-gray-200 rounded-xl shadow-lg" align="start">
                <Calendar
                  mode="single"
                  selected={deliveryDate}
                  onSelect={setDeliveryDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="p-4 pointer-events-auto rounded-xl"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter className="pt-6 border-t border-gray-200">
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1 h-12 border-2 border-gray-300 hover:bg-gray-50 rounded-xl font-medium transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDuplicate}
              disabled={!isFormValid || isLoading}
              className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg disabled:opacity-50 transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Duplicating...
                </div>
              ) : (
                'Duplicate Order'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};