import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Package, CheckCircle, Clock, Truck, XCircle, DollarSign } from 'lucide-react';
import { useCustomerLinenOrders } from '@/hooks/useCustomerLinenOrders';
import { CreateLinenOrderDialog } from './CreateLinenOrderDialog';
import { format } from 'date-fns';

const LinenOrdersView = () => {
  const { orders, loading, refetch } = useCustomerLinenOrders();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      case 'delivered':
        return <Truck className="h-4 w-4" />;
      case 'picked_up':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
      case 'picked_up':
        return <Badge variant="outline">Picked Up</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'unpaid':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <DollarSign className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading orders...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Linen Orders
            </CardTitle>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Order
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No linen orders found</p>
              <p className="text-sm">Create your first linen order to get started</p>
            </div>
          ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30 border-border/60 bg-white hover:shadow-primary/5">
              
              {/* Header with Order ID and Cost */}
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-[#185166] tracking-tight">
                      Linen Order #{order.id.slice(0, 8).toUpperCase()}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="w-full h-px bg-border/40 mt-2"></div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <div className="text-2xl font-bold text-[#18A5A5]">£{Number(order.total_cost).toFixed(2)}</div>
                    {getPaymentStatusIcon(order.payment_status)}
                  </div>
                </div>
              </div>
              
              {/* Delivery Date Information */}
              {order.delivery_date && (
                <div className="flex items-center gap-2 text-[#185166] mb-4 text-sm">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">Delivery: {new Date(order.delivery_date).toLocaleDateString('en-GB', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}</span>
                </div>
              )}

              {/* Items */}
              <div className="mb-4">
                <h4 className="font-medium text-[#185166] mb-3">Items Ordered:</h4>
                <div className="space-y-2">
                  {order.linen_order_items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium text-[#185166]">{item.linen_products.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">({item.linen_products.type})</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Qty: {item.quantity}</span>
                        <span className="font-bold text-[#185166]">£{Number(item.subtotal).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {order.notes && (
                <div className="mb-4">
                  <h4 className="font-medium text-[#185166] mb-2">Notes:</h4>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">{order.notes}</p>
                </div>
              )}
            </div>
          ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateLinenOrderDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onOrderCreated={() => {
          refetch();
          setShowCreateDialog(false);
        }}
      />
    </div>
  );
};

export default LinenOrdersView;