import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, Package } from "lucide-react";

interface EditOrderDialogProps {
  order: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditOrderDialog = ({ order, open, onOpenChange }: EditOrderDialogProps) => {
  const [formData, setFormData] = useState({
    delivery_date: "",
    pickup_date: "",
    status: "",
    payment_status: "",
    payment_method: "",
    notes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (order) {
      setFormData({
        delivery_date: order.delivery_date || "",
        pickup_date: order.pickup_date || "",
        status: order.status || "scheduled",
        payment_status: order.payment_status || "unpaid",
        payment_method: order.payment_method || "",
        notes: order.notes || ""
      });
    }
  }, [order]);

  const updateOrderMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const { error } = await supabase
        .from('linen_orders')
        .update(updateData)
        .eq('id', order.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linen-orders'] });
      onOpenChange(false);
      toast({ title: "Order updated successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error updating order", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = () => {
    updateOrderMutation.mutate(formData);
  };

  const statusOptions = [
    { value: "scheduled", label: "Scheduled", color: "bg-blue-500" },
    { value: "delivered", label: "Delivered", color: "bg-green-500" },
    { value: "picked_up", label: "Picked Up", color: "bg-gray-500" },
    { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
    { value: "postponed", label: "Postponed", color: "bg-yellow-500" }
  ];

  const paymentStatusOptions = [
    { value: "unpaid", label: "Unpaid", color: "bg-red-500" },
    { value: "paid", label: "Paid", color: "bg-green-500" },
    { value: "pending", label: "Pending", color: "bg-yellow-500" },
    { value: "refunded", label: "Refunded", color: "bg-gray-500" }
  ];

  const paymentMethodOptions = [
    { value: "cash", label: "Cash" },
    { value: "card", label: "Card" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "stripe", label: "Stripe" },
    { value: "invoice", label: "Invoice" }
  ];

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Edit Order #{order.id?.slice(-8)}
          </DialogTitle>
          <DialogDescription>
            Update order details, status, and payment information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info (Read-only) */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Customer</Label>
              <div className="font-medium">
                {order.customers?.first_name} {order.customers?.last_name}
              </div>
              <div className="text-sm text-muted-foreground">{order.customers?.email}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Address</Label>
              <div className="font-medium">{order.addresses?.address}</div>
              <div className="text-sm text-muted-foreground">{order.addresses?.postcode}</div>
            </div>
          </div>

          {/* Status Management */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Order Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${status.color}`} />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payment_status">Payment Status</Label>
              <Select value={formData.payment_status} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment status..." />
                </SelectTrigger>
                <SelectContent>
                  {paymentStatusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${status.color}`} />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <Label htmlFor="payment_method">Payment Method</Label>
            <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method..." />
              </SelectTrigger>
              <SelectContent>
                {paymentMethodOptions.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {method.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="delivery_date">Delivery Date</Label>
              <Input
                id="delivery_date"
                type="date"
                value={formData.delivery_date}
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="pickup_date">Pickup Date</Label>
              <Input
                id="pickup_date"
                type="date"
                value={formData.pickup_date}
                onChange={(e) => setFormData(prev => ({ ...prev, pickup_date: e.target.value }))}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={updateOrderMutation.isPending}
          >
            {updateOrderMutation.isPending ? "Updating..." : "Update Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};